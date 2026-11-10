import { readdir, rm, rmdir } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join, resolve, sep } from "node:path";
import { styleText } from "node:util";

import {
  build,
  createRunnableDevEnvironment,
  createServer,
  type HotUpdateOptions,
  type Plugin,
  type ResolvedConfig,
  type RunnableDevEnvironment,
  type UserConfig,
} from "vite";

import {
  type ChassisCommand,
  compileAliasPatterns,
  defaults,
  type GeneratorFactory,
  matchBase,
  type ProjectSettings,
  type ResolvedEntry,
  type SidecarService,
  type SourceFolder,
  sortByBase,
  type WatcherEvent,
} from "@kosmojs/core";
import type { DevSetup } from "@kosmojs/core/api";
import {
  cacheDir,
  createAliasPatterns,
  mergeConfigs,
  pathResolver,
  routesFactory,
  spinnerFactory,
  vitePluginsFactory,
} from "@kosmojs/lib";

import { cacheFactory } from "./cache";
import { previewFactory } from "./preview";
import { linkProgram, serialQueue, withDeadline } from "./reload";
import { deployRunner, writeFolderManifest } from "./runner";
import type { DisposableServerHandles } from "./types";

/**
 * A teardownHandler still pending this long is no longer waited for.
 * Shorter than the time the cli supervisor gives a worker to stop,
 * so a teardown that hangs still leaves room to close the servers.
 * */
const TEARDOWN_TIMEOUT_MS = 3_000;

/**
 * A default runner listens on Vite's hot channel and, told to full-reload,
 * evaluates its entry again by itself, next to what is already running:
 * one more API program with its own db pool and sockets, one more copy of a service's modules,
 * and nothing left to tear either down.
 *
 * Replacing what runs is done by the reloads below and nowhere else,
 * so the runner of such an environment gets no HMR client.
 * */
const createEnvironment = (name: string, config: ResolvedConfig) => {
  return createRunnableDevEnvironment(name, config, {
    runnerOptions: { hmr: false },
  });
};

// what a `hotUpdate` hook calls an event, to what the watch handlers are keyed by
const watcherEvents = {
  create: "add",
  update: "change",
  delete: "unlink",
} as const satisfies Record<HotUpdateOptions["type"], string>;

type ReturnSignature<C extends ChassisCommand> = C extends "serve" | "test"
  ? DisposableServerHandles
  : undefined;

export default async <C extends ChassisCommand>(
  command: C,
  projectSettings: ProjectSettings,
): Promise<ReturnSignature<C>> => {
  const { sourceFolders } = projectSettings;

  const { devHost, mode } = projectSettings;

  // NOTE: seed before anything else, regardless command
  for (const sourceFolder of sourceFolders) {
    for (const generator of sourceFolder.generators) {
      if (!generator.meta?.name || typeof generator.factory !== "function") {
        throw new Error(
          `${sourceFolder.name}: Unrecognized generator - must be created via defineGenerator()`,
        );
      }
      try {
        await generator.factory(projectSettings, sourceFolder).seed();
      } catch (error) {
        console.error(
          styleText(
            "red",
            `${sourceFolder.name}: ${generator.meta.name} generator failed to seed`,
          ),
        );
        throw error;
      }
    }
  }

  if (command === "build" || command === "preview") {
    for (const sourceFolder of sourceFolders) {
      await buildSourceFolder(projectSettings, sourceFolder);
      if (sourceFolder.config.frontend || sourceFolder.config.backend) {
        await writeFolderManifest(projectSettings, sourceFolder);
      }
    }

    await deployRunner(projectSettings);

    if (command === "preview") {
      await previewFactory(projectSettings, buildSourceFolder);
    }

    return undefined as ReturnSignature<C>;
  }

  if (command === "test") {
    // test command always come with a single source folder - the tested one.
    const [{ name, config }] = sourceFolders;

    if (
      config.frontend?.ssr &&
      typeof config.frontend.test === "object" &&
      config.frontend?.test?.ssr
    ) {
      // folder opted for SSR test harness

      const settings: ProjectSettings = {
        ...projectSettings,
        distDir: join(defaults.varDir, command, name),
        previewHost: devHost,
      };

      for (const sourceFolder of sourceFolders) {
        await buildSourceFolder(settings, sourceFolder);
        await writeFolderManifest(settings, sourceFolder);
      }

      await deployRunner(settings);

      const { restart, teardown } = await previewFactory(
        settings,
        buildSourceFolder,
        { standalone: false },
      );

      return { restart, teardown } as ReturnSignature<C>;
    }

    // use dev server for test harness
  }

  type RequestMatcher = (req: IncomingMessage) => boolean;
  type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

  const requestHandlers: Array<
    [
      path: string,
      matcherFactory: () => RequestMatcher,
      handlerFactory: () => RequestHandler,
      aliasMatcherFactory?: () => RequestMatcher | undefined,
    ]
  > = [];

  const restartHandlers: Array<() => Promise<unknown>> = [];
  const teardownHandlers: Array<() => Promise<unknown>> = [];

  const eventMap: Record<string, Awaited<ReturnType<typeof eventFactory>>> = {};

  // WARN: call this before starting any server!
  for (const sourceFolder of sourceFolders) {
    if (sourceFolder.config.frontend || sourceFolder.config.backend) {
      eventMap[sourceFolder.name] = await eventFactory(
        projectSettings,
        sourceFolder,
      );
    }
  }

  const [host, port] = devHost.split(":");

  const genericDefaults: UserConfig = {
    server: {
      watch: {
        atomic: true,
        awaitWriteFinish: {
          pollInterval: 200,
          stabilityThreshold: 600,
        },
      },
    },
  };

  const server = http.createServer((req, res) => {
    // an alias names an exact URL, so it is tried before any base,
    // including a longer base that belongs to another folder
    for (const [, , handlerFactory, aliasMatcherFactory] of handlers) {
      if (aliasMatcherFactory?.()?.(req)) {
        handlerFactory()(req, res);
        return;
      }
    }
    for (const [, matcherFactory, handlerFactory] of handlers) {
      // should be called on every request
      const [matcher, handler] = [matcherFactory(), handlerFactory()];
      if (matcher(req)) {
        handler(req, res);
        return;
      }
    }
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404: Not Found</h1>");
  });

  for (const sourceFolder of sourceFolders) {
    const { createPath } = pathResolver(projectSettings, sourceFolder);
    const { frontend, backend, sidecar } = sourceFolder.config;

    const requestMatchers = matchersFactory(sourceFolder);

    const vitePlugins = vitePluginsFactory(projectSettings, sourceFolder);

    const plugins = [
      vitePlugins.nodePrefix(),
      vitePlugins.tsconfigPaths(),
      vitePlugins.virtualModules({
        // The dev server is always a CSR graph - SSR runs in production builds only -
        // so env-sensitive modules resolve to their client variants here,
        // whatever a concurrent build is doing.
        kind: "csr",
        command,
      }),
    ];

    if (frontend) {
      // INFO: === start frontend server ===

      const generator = sourceFolder.generators.find(
        (e) => e.meta.slot === "frontend",
      );

      const viteServer = await createServer(
        mergeConfigs(
          genericDefaults,

          // user-provided config
          frontend?.viteConfig,

          // generator config - will override user-provided config
          generator
            ?.factory(projectSettings, sourceFolder)
            .viteConfig?.({ kind: "frontend", command }),

          // main config - will override everything
          {
            mode, // set via --mode
            base: frontend.base,
            root: createPath.src(),
            cacheDir: cacheDir(
              projectSettings,
              sourceFolder,
              `frontend:${command}`,
            ),
            plugins: [...plugins, vitePlugins.envProvider("frontend")],
            server: {
              host: devHost,
              allowedHosts: [host],
              middlewareMode: true,
              ws: {
                server,
                path: "@__kosmo_hmr__",
              },
            },
          },
        ),
      );

      // watchers replaced on every restart, re-add
      const addWatchers = () => {
        for (const [evt, handler] of Object.entries(
          eventMap[sourceFolder.name],
        )) {
          viteServer.watcher.on(evt, handler);
        }
      };

      addWatchers();

      requestHandlers.push([
        frontend.base,
        () => requestMatchers.frontend,
        () => viteServer.middlewares,
      ]);

      restartHandlers.push(async () => {
        await viteServer.restart();
        addWatchers();
      });

      teardownHandlers.push(viteServer.close);
    }

    if (backend) {
      // INFO: === start backend server ===

      const generator = sourceFolder.generators.find(
        (e) => e.meta.slot === "backend",
      );

      /**
       * Assigned once the first program is up.
       * The reload plugin below is installed during `createServer`,
       * before there is anything to reload, so its hook reaches the reload through this binding.
       * */
      let reload = async () => {};

      /**
       * Generators first: the files they rewrite for this event belong to the program loaded next.
       * Whether or not they succeed, a module of the running program changed, so it is reloaded.
       * */
      const onFileEvent = async ({ type, file }: HotUpdateOptions) => {
        try {
          await eventMap[sourceFolder.name][watcherEvents[type]](file);
        } catch (error) {
          console.error(
            styleText("red", `${sourceFolder.name}: watch handler failed`),
          );
          console.error(error);
        }
        await reload();
      };

      /**
       * A raw `watcher.on("change")` runs before Vite has invalidated the changed modules,
       * so a program reloaded from there can come back up running the source from before the save.
       *
       * `hotUpdate` is called after that invalidation, once per environment;
       * only `backend` resolves a module on this server.
       * Returning `[]` says the update is handled and leaves Vite nothing to propagate.
       *
       * A plugin survives `viteServer.restart()`, so there is nothing to re-add after one.
       * */
      const reloadPlugin: Plugin = {
        name: "kosmo:backend-reload",
        hotUpdate(options) {
          if (this.environment.name === "backend" && options.modules.length) {
            void onFileEvent(options);
          }
          return [];
        },
      };

      const viteServer = await createServer(
        mergeConfigs(
          genericDefaults,

          // user-provided config - will override defaults
          backend.viteConfig,

          // generator config - will override user-provided config
          generator
            ?.factory(projectSettings, sourceFolder)
            .viteConfig?.({ kind: "backend", command }),

          // main config - will override everything
          {
            mode, // set via --mode
            root: createPath.src(),
            appType: "custom",
            cacheDir: cacheDir(
              projectSettings,
              sourceFolder,
              `backend:${command}`,
            ),
            plugins: [
              ...plugins,
              reloadPlugin,
              vitePlugins.envProvider("backend"),
            ],
            server: {
              host: devHost,
              allowedHosts: [host],
              middlewareMode: true,
              // `hotUpdate` is part of the HMR pipeline, so it runs only with `hmr` on;
              // `ws: false` keeps Vite from binding a socket for it.
              hmr: true,
              ws: false,
            },
            resolve: {
              conditions: ["node"],
            },
            environments: {
              backend: {
                resolve: {
                  conditions: ["node"],
                },
                dev: { createEnvironment },
              },
            },
          },
        ),
      );

      // environments replaced on every restart, re-read
      const environment = () => {
        return viteServer.environments.backend as RunnableDevEnvironment;
      };

      const entry = join(defaults.apiDir, "dev.ts");

      const loadDevSetup = async () => {
        const { runner } = environment();
        runner.clearCache();
        return runner
          .import<{ default: DevSetup }>(entry)
          .then((e) => e.default);
      };

      /**
       * The running API program: api/dev.ts as evaluated, with whatever it opened along the way -
       * db pools, sockets, timers. None of that is visible from here;
       * only the program's own `teardownHandler` can close it.
       *
       * So a program is torn down exactly once, and the next one is evaluated only after that.
       * There is never more than one alive, and a port the old one held is free for the new one.
       *
       * Undefined from a teardown until the next load succeeds.
       * */
      let devSetup: DevSetup | undefined = await loadDevSetup();

      // reloads, restarts and the final teardown all replace the program, one at a time
      const queue = serialQueue();

      const closeProgram = async () => {
        const setup = devSetup;
        // dropped before its teardown runs, so nothing tears it down a second time
        devSetup = undefined;
        try {
          await withDeadline(
            async () => setup?.teardownHandler?.(),
            TEARDOWN_TIMEOUT_MS,
            `teardownHandler still pending after ${TEARDOWN_TIMEOUT_MS}ms`,
          );
        } catch (error) {
          // whatever it left open stays open; the next program is loaded regardless
          console.error(
            styleText("red", `${sourceFolder.name}: backend teardown failed`),
          );
          console.error(error);
        }
      };

      reload = queue.coalesce(async () => {
        try {
          await linkProgram(environment(), entry);
        } catch (error) {
          // the running program stays up; the save that fixes the file reloads
          console.error(
            styleText("red", `${sourceFolder.name}: backend reload skipped`),
          );
          console.error(error);
          return;
        }
        await closeProgram();
        try {
          devSetup = await loadDevSetup();
        } catch (error) {
          // keep the dev server alive; the next good save reloads
          console.error(
            styleText("red", `${sourceFolder.name}: backend reload failed`),
          );
          console.error(error);
        }
      });

      // answers while there is no program: mid-reload, or after a load that failed
      const unavailable: RequestHandler = (_req, res) => {
        res.writeHead(503, {
          "Content-Type": "text/plain",
          "Retry-After": "1",
        });
        res.end(
          `${sourceFolder.name}: API is reloading or failed to load, see the dev server output`,
        );
      };

      requestHandlers.push([
        backend.base,
        () => devSetup?.requestMatcher || requestMatchers.backend,
        () => devSetup?.requestHandler() || unavailable,
        // a custom requestMatcher owns matching entirely, aliases included
        () => (devSetup?.requestMatcher ? undefined : requestMatchers.alias),
      ]);

      restartHandlers.push(() => {
        return queue.run(async () => {
          await closeProgram();
          await viteServer.restart();
          devSetup = await loadDevSetup();
        });
      });

      // the program goes first, while the runner its code was loaded with is still up
      teardownHandlers.push(() => {
        // a save landing mid-teardown must not bring the program back
        reload = async () => {};
        return queue.run(async () => {
          await closeProgram();
          await viteServer.close();
        });
      });
    }

    if (sidecar?.serve) {
      /**
       * Assigned once the service is up; the reload plugin below is installed during `createServer`,
       * so the hook has to reach it through a binding rather than a closure
       * over something that does not exist yet.
       * */
      let reload = async () => {};

      /**
       * Restarting on a raw `watcher.on("change")` reads the module graph
       * before Vite has invalidated it, and the service comes back up running the source
       * as it was before the save.
       *
       * `hotUpdate` is called after that invalidation.
       * Returning `[]` says the update is handled and leaves Vite nothing to propagate.
       *
       * The hook runs once per environment; nothing but `sidecar` resolves a module on this server.
       * */
      const reloadPlugin: Plugin = {
        name: "kosmo:sidecar-reload",
        hotUpdate({ modules }) {
          if (modules.length) {
            void reload();
          }
          return [];
        },
      };

      const viteServer = await createServer(
        mergeConfigs(
          // user-provided config - lowest priority
          sidecar.viteConfig,
          // main config - highest priority
          {
            mode, // set via --mode
            root: createPath.src(),
            appType: "custom",
            cacheDir: cacheDir(projectSettings, sourceFolder, "sidecar"),
            plugins: [
              ...plugins,
              reloadPlugin,
              vitePlugins.envProvider("sidecar"),
            ],
            // `hotUpdate` is part of the HMR pipeline, so it runs only with `hmr` on -
            // but this server is never listened on, so no socket is ever bound and no port is taken.
            // `middlewareMode` keeps vite from installing its own SIGTERM handler,
            // which would close the server and exit before the service is torn down;
            // `ws: false` then keeps it from binding a standalone HMR socket instead.
            server: { hmr: true, middlewareMode: true, ws: false },
            resolve: {
              conditions: ["node"],
            },
            environments: {
              sidecar: {
                resolve: {
                  conditions: ["node"],
                },
                dev: { createEnvironment },
              },
            },
          },
        ),
      );

      // environments replaced on every restart, re-read
      const environment = () => {
        return viteServer.environments.sidecar as RunnableDevEnvironment;
      };

      const loadService = async () => {
        const { runner } = environment();
        runner.clearCache();
        return runner
          .import<{ default: SidecarService }>(sidecar.entry)
          .then((e) => e.default);
      };

      let service = await loadService();
      let close = await service.start();

      // reloads, restarts and the final teardown all replace the service, one at a time
      const queue = serialQueue();

      /**
       * The closer is dropped right before it is called, so it is called once,
       * whether it resolves, throws or never settles.
       * A real one throws when called again, and the sidecar would never come back.
       * */
      const stopService = async () => {
        await withDeadline(
          async () => {
            await service.teardown?.();
            const closer = close;
            close = async () => {};
            await closer();
          },
          TEARDOWN_TIMEOUT_MS,
          `service still closing after ${TEARDOWN_TIMEOUT_MS}ms`,
        );
      };

      const reloadService = async () => {
        try {
          /**
           * Load before stopping anything: a save that cannot compile throws here,
           * and the running service is left untouched, not closed with nothing to replace it.
           *
           * Starting still happens after closing,
           * so a service holding a port frees it before the new one binds.
           * */
          const next = await loadService();
          await stopService();
          service = next;
          close = await service.start();
        } catch (error) {
          // keep the dev server alive; the next good save reloads
          console.error(
            styleText("red", `${sourceFolder.name}: sidecar reload failed`),
          );
          console.error(error);
        }
      };

      reload = queue.coalesce(reloadService);

      restartHandlers.push(() => {
        return queue.run(async () => {
          await viteServer.restart();
          await reloadService();
        });
      });

      // the service goes first, while the runner its code was loaded with is still up
      teardownHandlers.push(() => {
        // a save landing mid-teardown must not start the service again
        reload = async () => {};
        return queue.run(async () => {
          try {
            await stopService();
          } catch (error) {
            // still close the vite server below
            console.error(
              styleText("red", `${sourceFolder.name}: sidecar teardown failed`),
            );
            console.error(error);
          }
          await viteServer.close();
        });
      });
    }
  }

  // most specific base first, same order as dist/run.js
  // WARN: keep this after folders loop
  const handlers = sortByBase(requestHandlers, ([path]) => path);

  server.on("error", (error) => {
    console.error(styleText("red", `Failed to start dev server on ${devHost}`));
    console.error(error.message);
    process.exit(1);
  });

  server.listen({ host, port });

  teardownHandlers.push(async () => {
    server.close();
  });

  return {
    restart: async () => {
      for (const handler of restartHandlers) {
        await handler();
      }
    },
    teardown: async () => {
      for (const handler of teardownHandlers) {
        await handler();
      }
      // Let chokidar fully release file handles
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
  } as ReturnSignature<C>;
};

/**
 * Production build of one source folder - generators, client bundle, api bundle,
 * then the generators' post-build steps (ssr, ssg).
 * Shared by `build` and `preview`: preview is a production build that reruns on change,
 * so generators are told `command: "build"` and the build cache is the same.
 * */
const buildSourceFolder = async (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
) => {
  const { mode } = projectSettings;
  const command = "build";

  const { createPath } = pathResolver(projectSettings, sourceFolder);
  const { frontend, backend, sidecar } = sourceFolder.config;

  const resolvedRoutes = [];

  if (!sourceFolder.config.sidecar) {
    const { resolvers } = await routesFactory(
      projectSettings,
      sourceFolder,
      cacheFactory,
    );

    const spinner = spinnerFactory(`${sourceFolder.name}: resolving routes`);

    for (const { name, handler } of resolvers.values()) {
      spinner.append(
        `[ ${resolvedRoutes.length + 1} of ${resolvers.size} ] ${name}`,
      );
      resolvedRoutes.push(await handler());
    }

    spinner.succeed("ready ✨");
  }

  const vitePlugins = vitePluginsFactory(projectSettings, sourceFolder);

  const plugins = [
    vitePlugins.nodePrefix(),
    vitePlugins.tsconfigPaths(),
    vitePlugins.virtualModules({
      // `kind: "csr"` everywhere except the SSR bundle,
      // which installs its own copy with `kind: "ssr"`
      kind: "csr",
      command,
    }),
  ];

  for (const generator of sourceFolder.generators) {
    await generator
      .factory(projectSettings, sourceFolder)
      .build?.(resolvedRoutes);
  }

  if (frontend) {
    // INFO: === build the frontend ===

    const generator = sourceFolder.generators.find(
      (e) => e.meta.slot === "frontend",
    );

    await build(
      mergeConfigs(
        // user-provided config - lowest priority
        frontend.viteConfig,

        // generator config - higher priority
        generator
          ?.factory(projectSettings, sourceFolder)
          .viteConfig?.({ kind: "frontend", command }),

        // main config - highest priority
        {
          mode, // set via --mode
          base: frontend.base,
          root: createPath.src(),
          cacheDir: cacheDir(
            projectSettings,
            sourceFolder,
            `frontend:${command}`,
          ),
          plugins: [...plugins, vitePlugins.envProvider("frontend")],
          build: {
            outDir: createPath.distDir("client"),
            manifest: true,
            emptyOutDir: true,
          },
        },
      ),
    );
  }

  if (backend) {
    // INFO: === build the backend ===

    const generator = sourceFolder.generators.find(
      (e) => e.meta.slot === "backend",
    );

    await build(
      mergeConfigs(
        // user-provided config - lowest priority
        backend.viteConfig,

        // generator config - higher priority
        generator
          ?.factory(projectSettings, sourceFolder)
          .viteConfig?.({ kind: "backend", command }),

        // main config - highest priority
        {
          mode, // set via --mode
          base: "./",
          root: createPath.src(),
          appType: "custom",
          plugins: [...plugins, vitePlugins.envProvider("backend")],
          resolve: {
            conditions: ["node"],
          },
          build: {
            ssr: true,
            target: "esnext",
            sourcemap: true,
            emptyOutDir: true,
            rolldownOptions: {
              input: [
                createPath.api("app.ts"),
                createPath.api("server.ts"),
                // node listener for dist/run.js - the app without a port
                createPath.lib("@api/listener.ts"),
              ],
              output: {
                dir: createPath.distDir("api"),
                format: "esm",
              },
            },
          },
          cacheDir: cacheDir(
            projectSettings,
            sourceFolder,
            `backend:${command}`,
          ),
        },
      ),
    );
  }

  if (sidecar) {
    // INFO: === build the sidecar ===
    await build(
      mergeConfigs(
        // user-provided config - lowest priority
        sidecar.viteConfig,
        // main config - highest priority
        {
          base: "./",
          root: createPath.src(),
          appType: "custom",
          plugins: [...plugins, vitePlugins.envProvider("sidecar")],
          resolve: {
            conditions: ["node"],
          },
          build: {
            ssr: true,
            target: "esnext",
            sourcemap: true,
            emptyOutDir: true,
            rolldownOptions: {
              input: {
                entry: createPath.src(sidecar.entry),
                ...(sidecar.run ? { run: sidecar.run } : {}),
              },
              output: {
                dir: createPath.distDir("sidecar"),
                format: "esm",
              },
            },
          },
          cacheDir: cacheDir(projectSettings, sourceFolder, "sidecar"),
        },
      ),
    );
  }

  for (const generator of sourceFolder.generators) {
    await generator
      .factory(projectSettings, sourceFolder)
      .postBuild?.(resolvedRoutes);
  }
};

const eventFactory = async (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
): Promise<
  Record<"add" | "change" | "unlink", (f: string) => Promise<void>>
> => {
  const { resolvers, resolversFactory } = await routesFactory(
    projectSettings,
    sourceFolder,
    cacheFactory,
  );

  const { createPath } = pathResolver(projectSettings, sourceFolder);

  const generators: Array<{
    name: string | undefined;
    factory: GeneratorFactory;
  }> = [];

  for (const generator of sourceFolder.generators) {
    const factory = generator.factory(projectSettings, sourceFolder);
    generators.push({ name: generator.meta.name, factory });
  }

  const resolvedRoutes = new Map<
    string, // fileFullpath
    ResolvedEntry
  >();

  const runGenerators = async (event?: WatcherEvent) => {
    /**
     * Watch handlers receive the full list of entries
     * and should process only those whose source file or dependencies were updated.
     * */
    const entries = Array.from(resolvedRoutes.values());

    for (const { name, factory } of generators) {
      try {
        await factory.watch?.(entries, event);
      } catch (error) {
        console.error(
          styleText("red", `${sourceFolder.name}: ${name} generator failed`),
        );
        if (event) {
          console.error(event);
        }
        console.error(error);
      }
    }
  };

  const updateResolvedEntry = async (file: string) => {
    const resolver = resolvers.get(file);

    if (!resolver) {
      return;
    }

    try {
      const resolvedEntry = await resolver.handler(file);
      resolvedRoutes.set(resolvedEntry.entry.fileFullpath, resolvedEntry);
      return resolvedEntry;
    } catch (error) {
      const route = file.replace(`${createPath.api()}/`, "");
      console.error(
        styleText(
          "red",
          `${sourceFolder.name}: ${route} route resolution failed`,
        ),
      );
      console.error(error);
      return;
    }
  };

  {
    const spinner = spinnerFactory(`${sourceFolder.name}: resolving routes`);
    for (const { name, handler } of resolvers.values()) {
      spinner.append(
        `[ ${resolvedRoutes.size + 1} of ${resolvers.size} ] ${name}`,
      );
      const route = await handler();
      resolvedRoutes.set(route.entry.fileFullpath, route);
    }
    spinner.succeed("ready ✨");
  }

  // NOTE: call only after routes resolved
  await runGenerators();

  return {
    async add(file) {
      const [resolver] = resolversFactory([file]).values();

      if (!resolver) {
        return;
      }

      resolvers.set(file, resolver);

      // call only after `resolvers.set(file)`
      const resolvedEntry = await updateResolvedEntry(file);

      if (resolvedEntry) {
        await runGenerators({ kind: "create", file });
      }
    },

    async change(file) {
      if (resolvedRoutes.has(file)) {
        // route updated
        await updateResolvedEntry(file);
      } else {
        // updating entries that are referencing updated file
        const relatedRoutes = resolvedRoutes
          .values()
          .flatMap(({ kind, entry }) => {
            return kind === "apiRoute"
              ? entry.referencedFiles.includes(file)
                ? [entry]
                : []
              : [];
          });

        for (const route of relatedRoutes) {
          await updateResolvedEntry(route.fileFullpath);
        }
      }

      await runGenerators({ kind: "update", file });
    },

    async unlink(file) {
      // route deleted
      const resolved = resolvedRoutes.get(file);

      resolvers.delete(file);
      resolvedRoutes.delete(file);

      if (resolved?.kind === "apiRoute") {
        /**
         * Generators regenerate the files that list all routes,
         * but nothing rewrites the per-route files of a route that is gone:
         * types, schemas, the fetch client and the derivation cache.
         * */
        await removeDerivedFiles(
          createPath.libApi(dirname(resolved.entry.file)),
          createPath.libApi(),
        );
      }

      await runGenerators({ kind: "delete", file });
    },
  };
};

const matchersFactory: (
  sourceFolder: SourceFolder,
) => Record<
  "frontend" | "backend" | "alias",
  (req: IncomingMessage) => boolean
> = ({ config }) => {
  const [frontendBase, backendBase] = [
    config.frontend?.base,
    config.backend?.base,
  ];

  const backendAliasPatterns = backendBase
    ? compileAliasPatterns(createAliasPatterns(config.backend?.alias))
    : [];

  const pathnameOf = (req: IncomingMessage) => {
    return new URL(req.url ?? "/", "http://localhost").pathname;
  };

  const aliasMatch = (path: string) => {
    return backendAliasPatterns.some((pattern) => pattern.test(path));
  };

  const backendMatch = (path: string) => {
    if (!backendBase) {
      return false;
    }
    return matchBase(backendBase, path) || aliasMatch(path);
  };

  return {
    frontend(req) {
      if (!frontendBase) {
        return false;
      }
      const pathname = pathnameOf(req);
      return backendMatch(pathname) ? false : matchBase(frontendBase, pathname);
    },
    backend(req) {
      return backendMatch(pathnameOf(req));
    },
    alias(req) {
      return aliasMatch(pathnameOf(req));
    },
  };
};

/**
 * Removes the files directly inside `dir`, leaving its subdirectories alone,
 * then removes `dir` and its parents, up to but excluding `root`, while they are empty.
 *
 * Used when a route is deleted: its derived files sit in a directory
 * that may also hold the directories of nested routes, which must survive.
 * */
export const removeDerivedFiles = async (
  dir: string,
  root: string,
): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    },
  );

  for (const entry of entries) {
    if (entry.isFile()) {
      await rm(join(dir, entry.name), { force: true });
    }
  }

  const stop = resolve(root);
  let current = resolve(dir);

  while (current.startsWith(`${stop}${sep}`)) {
    const remaining = await readdir(current).catch(() => undefined);
    if (!remaining || remaining.length) {
      break;
    }
    await rmdir(current);
    current = dirname(current);
  }
};
