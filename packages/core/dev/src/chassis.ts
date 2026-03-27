import { rm } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import net from "node:net";
import { join, resolve } from "node:path";
import { styleText } from "node:util";

import { build, createServer, isRunnableDevEnvironment } from "vite";

import type { DevSetup } from "@kosmojs/api";
import {
  defaults,
  type GeneratorBase,
  type GeneratorFactoryInstance,
  type GeneratorMeta,
  type ProjectSettings,
  pathResolver,
  type ResolvedEntry,
  routesFactory,
  type SourceFolder,
  spinnerFactory,
  type WatcherEvent,
} from "@kosmojs/lib";

import { cacheFactory } from "./cache";
import stubGenerator from "./stub-generator";

export default async (
  projectSettings: ProjectSettings,
): Promise<() => Promise<void>> => {
  const { devPort, command } = projectSettings;

  if (command === "build") {
    for (const sourceFolder of projectSettings.sourceFolders) {
      const { config, baseurl } = sourceFolder;
      const { resolvers } = await routesFactory(sourceFolder, cacheFactory);
      const { createPath } = pathResolver(sourceFolder);

      const resolvedEntries = [];

      // resolving routes
      {
        const spinner = spinnerFactory("Resolving Routes");

        for (const { name, handler } of resolvers.values()) {
          spinner.append(
            `[ ${resolvedEntries.length + 1} of ${resolvers.size} ] ${name}`,
          );
          resolvedEntries.push(await handler());
        }

        spinner.succeed();
      }

      const generators = folderGenerators(sourceFolder);
      const plugins = [...(config.plugins || [])];

      for (const base of generators) {
        const factory = base.factory(sourceFolder);
        await factory.start();
        await factory.build(resolvedEntries);
        plugins.push(...factory.plugins(command));
      }

      // build client
      {
        const outDir = createPath.distDir("client");

        // emptyOutDir wont work cause outDir is outside project root
        await rm(outDir, { recursive: true, force: true });

        await build({
          ...config,
          configFile: false,
          root: createPath.src(),
          base: join(baseurl, "/"),
          plugins,
          define: {
            ...config.define,
            KOSMO_SSR_MODE: "false",
          },
          resolve: {
            ...config.resolve,
            tsconfigPaths: true,
          },
          build: {
            ...config?.build,
            outDir,
            manifest: true,
          },
          cacheDir: cacheDir(sourceFolder, command, "client"),
        });
      }

      // build backend
      if (generators.find((e) => e.meta.slot === "api")) {
        const dir = createPath.distDir("api");

        // emptyOutDir wont work cause dir is outside project root
        await rm(dir, { recursive: true, force: true });

        await build({
          configFile: false,
          root: createPath.src(),
          appType: "custom",
          define: {
            ...config.define,
            KOSMO_PRODUCTION_BUILD: "true",
          },
          resolve: {
            ...config.resolve,
            tsconfigPaths: true,
            conditions: ["node"],
          },
          build: {
            ssr: true,
            target: "esnext",
            sourcemap: true,
            rolldownOptions: {
              input: [createPath.api("app.ts"), createPath.api("server.ts")],
              output: { dir, format: "esm" },
            },
          },
          cacheDir: cacheDir(sourceFolder, command, "backend"),
        });
      }
    }

    return async () => {};
  }

  type RequestMatcher = (req: IncomingMessage) => boolean;
  type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

  const requestHandlers: Record<
    string,
    [matcherFactory: () => RequestMatcher, handlerFactory: () => RequestHandler]
  > = {};

  const teardownHandlers: Array<() => Promise<unknown>> = [];

  // bootstraping client servers
  for (const sourceFolder of projectSettings.sourceFolders) {
    const { config } = sourceFolder;

    const { createPath } = pathResolver(sourceFolder);
    const requestMatchers = matchersFactory(sourceFolder);
    const port = await findFreePort(devPort);

    const generators = folderGenerators(sourceFolder);
    const plugins = [...(config.plugins || [])];

    for (const base of generators) {
      const factory = base.factory(sourceFolder);
      plugins.push(...factory.plugins(command));
    }

    const viteServer = await createServer({
      ...config,
      configFile: false,
      root: createPath.src(),
      plugins,
      server: {
        ...config.server,
        middlewareMode: true,
        hmr: { port },
      },
      resolve: {
        ...config.resolve,
        tsconfigPaths: true,
      },
      define: {
        ...config.define,
        KOSMO_SSR_MODE: "false",
      },
      cacheDir: cacheDir(sourceFolder, command, "client"),
    });

    requestHandlers[sourceFolder.name] = [
      () => requestMatchers.base,
      () => viteServer.middlewares,
    ];

    teardownHandlers.push(viteServer.close);
  }

  // bootstraping backend servers
  for (const sourceFolder of projectSettings.sourceFolders) {
    const { config } = sourceFolder;

    const events = await eventFactory(sourceFolder);

    if (!folderGenerators(sourceFolder).find((e) => e.meta.slot === "api")) {
      continue;
    }

    const { createPath } = pathResolver(sourceFolder);

    const requestMatchers = matchersFactory(sourceFolder);

    const viteServer = await createServer({
      configFile: false,
      root: createPath.src(),
      appType: "custom",
      server: { middlewareMode: true },
      resolve: { tsconfigPaths: true },
      define: {
        ...config?.define,
        KOSMO_PRODUCTION_BUILD: "false",
      },
      environments: {
        api: {
          resolve: {
            conditions: ["node"],
          },
        },
      },
      cacheDir: cacheDir(sourceFolder, command, "backend"),
    });

    const env = viteServer.environments.api;

    if (isRunnableDevEnvironment(env)) {
      const load = async () => {
        env.runner.clearCache();
        return env.runner
          .import<{ default: DevSetup }>(join(defaults.apiDir, "dev.ts"))
          .then((e) => e.default);
      };

      let devSetup = await load();

      for (const [event, handler] of [
        ["add", events.create],
        ["unlink", events.update],
        ["change", events.update],
      ] as const) {
        viteServer.watcher.on(event, async (file) => {
          const mods = env.moduleGraph.getModulesByFile(file);
          if (mods?.size) {
            await handler(file);
            await devSetup?.teardownHandler?.();
            devSetup = await load();
          }
        });
      }

      requestHandlers[`${sourceFolder.name}/api`] = [
        () => devSetup.requestMatcher || requestMatchers.api,
        () => devSetup.requestHandler(),
      ];

      teardownHandlers.push(viteServer.close);
    } else {
      console.warn(
        styleText(
          "red",
          `${sourceFolder.name}: api environment is not runnable`,
        ),
      );
      console.warn(
        `Ensure no custom createEnvironment override is preventing it, got "${env.constructor.name}"`,
      );
      console.warn();
      try {
        await viteServer.close();
      } catch (
        // biome-ignore lint: any
        error: any
      ) {
        console.error(
          styleText("red", `${sourceFolder.name}: dev server failed to close`),
        );
        console.error(error.message);
      }
    }
  }

  // sorting is essential to avoid matching /app before /app/admin
  const handlers = Object.entries(requestHandlers)
    .sort(([a], [b]) => b.split("/").length - a.split("/").length)
    .map(([, factories]) => factories);

  const httpServer = http.createServer((req, res) => {
    for (const [matcherFactory, handlerFactory] of handlers) {
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

  httpServer.on("error", (error) => {
    console.error(
      styleText("red", `Failed to start dev server on port ${devPort}`),
    );
    console.error(error.message);
    process.exit(1);
  });

  httpServer.listen(devPort);

  teardownHandlers.push(async () => {
    httpServer.close();
  });

  return async () => {
    for (const handler of teardownHandlers) {
      await handler().catch(console.error);
    }
    // Let chokidar fully release file handles
    await new Promise((resolve) => setTimeout(resolve, 100));
  };
};

const cacheDir = (
  { root, name }: SourceFolder,
  command: ProjectSettings["command"],
  mode: "client" | "backend",
) => {
  return resolve(root, `var/.vite/${name}/${command}/${mode}`);
};

const folderGenerators = (sourceFolder: SourceFolder): Array<GeneratorBase> => {
  const { generators = [] } = sourceFolder.config;

  const coreGenerators: Partial<
    Record<NonNullable<GeneratorMeta["slot"]>, GeneratorBase>
  > = {};

  const userGenerators: Array<GeneratorBase> = [];

  for (const base of generators) {
    if (base.meta.slot) {
      coreGenerators[base.meta.slot] = base;
    } else {
      userGenerators.push(base);
    }
  }

  return [
    // 1. stub generator should run first
    stubGenerator(),
    // 2. then api generator
    ...(coreGenerators.api ? [coreGenerators.api] : []),
    // 3. then fetch generator, only if api generator also enabled
    ...(coreGenerators.fetch && coreGenerators.api
      ? [coreGenerators.fetch]
      : []),
    // 4. then mdx generator
    ...(coreGenerators.mdx ? [coreGenerators.mdx] : []),
    // 5. user generators in the order they were added
    ...userGenerators,
    // 6. and ssr generator should run last
    ...(coreGenerators.ssr ? [coreGenerators.ssr] : []),
  ];
};

const eventFactory = async (
  sourceFolder: SourceFolder,
): Promise<
  Record<"create" | "update" | "delete", (f: string) => Promise<void>>
> => {
  const { resolvers, resolversFactory } = await routesFactory(
    sourceFolder,
    cacheFactory,
  );

  const { createPath } = pathResolver(sourceFolder);

  const generators: Array<{
    name: string | undefined;
    factory: GeneratorFactoryInstance;
  }> = [];

  for (const base of folderGenerators(sourceFolder)) {
    if (!base.meta?.name) {
      console.error(
        styleText(
          "red",
          `${sourceFolder.name}: Unrecognized generator - must be created via defineGenerator()`,
        ),
      );
      continue;
    }

    try {
      const factory = base.factory(sourceFolder);
      await factory.start();
      generators.push({ name: base.meta.name, factory });
    } catch (error) {
      console.error(
        styleText(
          "red",
          `${sourceFolder.name}: ${base.meta.name} generator failed to initialize`,
        ),
      );
      console.error(error);
    }
  }

  const resolvedEntries = new Map<
    string, // fileFullpath
    ResolvedEntry
  >();

  const runGenerators = async (event?: WatcherEvent) => {
    /**
     * Watch handlers receive the full list of entries
     * and should process only those whose source file or dependencies were updated.
     * */
    const entries = Array.from(resolvedEntries.values());

    for (const { name, factory } of generators) {
      try {
        await factory.watch(entries, event);
      } catch (error) {
        console.error(
          styleText("red", `${sourceFolder.name}: ${name} generator failed`),
        );
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
      resolvedEntries.set(resolvedEntry.entry.fileFullpath, resolvedEntry);
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
    let spinner = spinnerFactory("Resolving Routes");

    for (const { name, handler } of resolvers.values()) {
      spinner.append(
        `${sourceFolder.name}: [ ${resolvedEntries.size + 1} of ${resolvers.size} ] ${name}`,
      );
      try {
        const resolvedEntry = await handler();
        resolvedEntries.set(resolvedEntry.entry.fileFullpath, resolvedEntry);
      } catch (
        // biome-ignore lint: any
        error: any
      ) {
        spinner.failed(error);
        spinner = spinnerFactory("Resolving Routes");
      }
    }

    spinner.succeed();
  }

  // NOTE: call only after generators initialized and routes resolved
  await runGenerators();

  return {
    async create(file: string) {
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

    async update(file: string) {
      if (resolvedEntries.has(file)) {
        // route updated
        await updateResolvedEntry(file);
      } else {
        // updating entries that are referencing updated file
        const relatedRoutes = resolvedEntries
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

    async delete(file) {
      // route deleted
      resolvers.delete(file);
      resolvedEntries.delete(file);
      await runGenerators({ kind: "delete", file });
    },
  };
};

const matchersFactory: (
  sourceFolder: SourceFolder,
) => Record<"base" | "api", (req: IncomingMessage) => boolean> = ({
  baseurl,
  apiurl,
}) => {
  const basePattern = new RegExp(`^${baseurl}($|/*)`);
  const apiPattern = new RegExp(`^${join(baseurl, apiurl)}($|/*)`);
  return {
    base(req) {
      return apiPattern.test(req.url as string)
        ? false
        : basePattern.test(req.url as string);
    },
    api(req) {
      return apiPattern.test(req.url as string);
    },
  };
};

const findFreePort = async (devPort: number): Promise<number> => {
  let minPort = 0;
  let maxPort = 0;

  for (const n of [3, 2, 1, ""]) {
    minPort = Number(`${n}${devPort}`) + 100;
    maxPort = minPort + 100;
    if (maxPort < 65000) {
      break;
    }
  }

  if (maxPort > 65000) {
    throw new Error("the devPort in package.json should be less than 64000");
  }

  const range = maxPort - minPort + 1;
  const startOffset = Math.floor(Math.random() * range);

  const ports = Array.from({ length: range }, (_, i) => {
    return minPort + ((startOffset + i) % range);
  });

  const freePort = await ports.reduce(
    async (prevPromise, port) => {
      const freePort = await prevPromise;
      if (freePort) {
        return freePort;
      }
      const isFree = await isPortFree(port);
      return isFree ? port : undefined;
    },
    Promise.resolve(undefined as number | undefined),
  );

  if (!freePort) {
    throw new Error(`No free ports found in range ${minPort}-${maxPort}`);
  }

  return freePort;
};

const isPortFree = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, "127.0.0.1");
  });
};
