import { readdir, rm, rmdir } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join, resolve, sep } from "node:path";
import { styleText } from "node:util";

import {
  build,
  createServer,
  type Plugin,
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
  findFreePortRange,
  mergeConfigs,
  pathResolver,
  routesFactory,
  spinnerFactory,
  vitePlugins,
} from "@kosmojs/lib";

import { cacheFactory } from "./cache";
import { previewFactory } from "./preview";
import { deployRunner, writeFolderManifest } from "./runner";

type ReturnSignature<C extends ChassisCommand> = C extends "serve" | "test"
  ? {
      restart: () => Promise<void>;
      teardown: () => Promise<void>;
    }
  : undefined;

export default async <C extends ChassisCommand>(
  command: C,
  projectSettings: ProjectSettings,
): Promise<ReturnSignature<C>> => {
  const { sourceFolders } = projectSettings;

  const { devHost } = projectSettings;

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

  // 4 ports per folder, 2 per server (main and hmr)
  let [floatingPort] = await findFreePortRange(host, sourceFolders.length * 4);

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

  for (const sourceFolder of sourceFolders) {
    const { createPath } = pathResolver(projectSettings, sourceFolder);
    const { frontend, backend, sidecar } = sourceFolder.config;

    const requestMatchers = matchersFactory(sourceFolder);

    const plugins = [
      vitePlugins.tsconfigPaths(projectSettings, sourceFolder),
      vitePlugins.nodePrefix(),
      vitePlugins.virtualModules(projectSettings, sourceFolder, {
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
            base: frontend.base,
            root: createPath.src(),
            cacheDir: cacheDir(
              projectSettings,
              sourceFolder,
              `frontend:${command}`,
            ),
            plugins,
            server: {
              host: devHost,
              port: floatingPort++,
              middlewareMode: true,
              ws: {
                host,
                port: floatingPort++,
              },
            },
          },
        ),
      );

      for (const [evt, handler] of Object.entries(
        eventMap[sourceFolder.name],
      )) {
        viteServer.watcher.on(evt, handler);
      }

      requestHandlers.push([
        frontend.base,
        () => requestMatchers.frontend,
        () => viteServer.middlewares,
      ]);

      restartHandlers.push(viteServer.restart);
      teardownHandlers.push(viteServer.close);
    }

    if (backend) {
      // INFO: === start backend server ===

      const generator = sourceFolder.generators.find(
        (e) => e.meta.slot === "backend",
      );

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
            root: createPath.src(),
            appType: "custom",
            cacheDir: cacheDir(
              projectSettings,
              sourceFolder,
              `backend:${command}`,
            ),
            plugins,
            server: {
              host: devHost,
              port: floatingPort++,
              middlewareMode: true,
              ws: {
                host,
                port: floatingPort++,
              },
            },
            resolve: {
              conditions: ["node"],
            },
            environments: {
              backend: {
                resolve: {
                  conditions: ["node"],
                },
              },
            },
          },
        ),
      );

      const env = viteServer.environments.backend as RunnableDevEnvironment;

      const loadDevSetup = async () => {
        env.runner.clearCache();
        return env.runner
          .import<{ default: DevSetup }>(join(defaults.apiDir, "dev.ts"))
          .then((e) => e.default);
      };

      let devSetup = await loadDevSetup();

      for (const [evt, handler] of Object.entries(
        eventMap[sourceFolder.name],
      )) {
        viteServer.watcher.on(evt, async (file) => {
          const mods = env.moduleGraph.getModulesByFile(file);
          if (mods?.size) {
            try {
              await handler(file);
              await devSetup?.teardownHandler?.();
              devSetup = await loadDevSetup();
            } catch (error) {
              // keep the dev server alive; the next good save reloads
              console.error(
                styleText("red", `${sourceFolder.name}: backend reload failed`),
              );
              console.error(error);
            }
          }
        });
      }

      requestHandlers.push([
        backend.base,
        () => devSetup.requestMatcher || requestMatchers.backend,
        () => devSetup.requestHandler(),
        // a custom requestMatcher owns matching entirely, aliases included
        () => (devSetup.requestMatcher ? undefined : requestMatchers.alias),
      ]);

      restartHandlers.push(viteServer.restart);
      teardownHandlers.push(viteServer.close);
    }

    if (sidecar?.serve) {
      /**
       * Assigned once the service is up; the reload plugin below is installed during `createServer`,
       * so the hook has to reach it through a binding rather than a closure over something that does not exist yet.
       * */
      let reload = async () => {};

      /**
       * Restarting on a raw `watcher.on("change")` reads the module graph before Vite has invalidated it,
       * and the service comes back up running the source as it was before the save.
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
            root: createPath.src(),
            appType: "custom",
            cacheDir: cacheDir(projectSettings, sourceFolder, "sidecar"),
            plugins: [...plugins, reloadPlugin],
            // `hotUpdate` is part of the HMR pipeline, so it runs only with `hmr` on -
            // but this server is never listened on, so no socket is ever bound and no port is taken.
            server: { hmr: true },
            resolve: {
              conditions: ["node"],
            },
            environments: {
              sidecar: {
                resolve: {
                  conditions: ["node"],
                },
              },
            },
          },
        ),
      );

      const env = viteServer.environments.sidecar as RunnableDevEnvironment;

      const loadService = async () => {
        env.runner.clearCache();
        return env.runner
          .import<{ default: SidecarService }>(sidecar.entry)
          .then((e) => e.default);
      };

      let service = await loadService();
      let close = await service.start();

      reload = async () => {
        try {
          /**
           * Load before tearing anything down: a save that cannot compile throws here,
           * and the running service is left untouched rather than closed with nothing to replace it -
           * which is unrecoverable for a service whose close function cannot run twice.
           *
           * Starting still happens after closing, so a service holding a port frees it before the new one binds.
           * */
          const next = await loadService();
          await service.teardown?.();
          await close();
          /**
           * Nothing is running between here and `start()`, so drop the closer:
           * a `start()` that throws would otherwise leave the next reload calling it a second time,
           * which for a real one throws too - and the sidecar never comes back.
           * */
          close = async () => {};
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

      teardownHandlers.push(viteServer.close);
    }
  }

  // most specific base first, same order as dist/run.js
  const handlers = sortByBase(requestHandlers, ([path]) => path);

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
  const command = "build";

  const { createPath } = pathResolver(projectSettings, sourceFolder);
  const { frontend, backend, sidecar } = sourceFolder.config;

  const resolvedRoutes = [];

  if (!sidecar) {
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

  const plugins = [
    vitePlugins.tsconfigPaths(projectSettings, sourceFolder),
    vitePlugins.nodePrefix(),
    vitePlugins.virtualModules(projectSettings, sourceFolder, {
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
          base: frontend.base,
          root: createPath.src(),
          cacheDir: cacheDir(
            projectSettings,
            sourceFolder,
            `frontend:${command}`,
          ),
          plugins,
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
          base: "./",
          root: createPath.src(),
          appType: "custom",
          plugins,
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
          plugins,
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
