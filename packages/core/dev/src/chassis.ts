import { rm } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import net from "node:net";
import { join, resolve } from "node:path";
import { styleText } from "node:util";

import { build, createServer, type RunnableDevEnvironment } from "vite";

import type {
  GeneratorBase,
  GeneratorFactoryInstance,
  GeneratorMeta,
  ProjectSettings,
  ResolvedEntry,
  SourceFolder,
  WatcherEvent,
} from "@kosmojs/core";
import type { DevSetup } from "@kosmojs/core/api";
import {
  defaults,
  pathResolver,
  routesFactory,
  spinnerFactory,
  vitePlugins,
} from "@kosmojs/lib";

import { cacheFactory } from "./cache";
import coreGenerator from "./core-generator";

export default async (
  projectSettings: ProjectSettings,
): Promise<() => Promise<void>> => {
  const { devPort, command } = projectSettings;

  // NOTE: initialize generators before anything else, regardless command
  for (const sourceFolder of projectSettings.sourceFolders) {
    for (const base of folderGenerators(sourceFolder)) {
      if (!base.meta?.name || typeof base.factory !== "function") {
        throw new Error(
          `${sourceFolder.name}: Unrecognized generator - must be created via defineGenerator()`,
        );
      }

      const factory = base.factory(sourceFolder);

      if (!factory.meta?.name) {
        throw new Error(
          `${sourceFolder.name}: ${base.meta.name} generator is missing meta property`,
        );
      }

      for (const prop of ["start", "watch", "build", "plugins"] as const) {
        if (typeof factory[prop] !== "function") {
          throw new Error(
            `${sourceFolder.name}: ${base.meta.name} generator is missing ${prop} hook`,
          );
        }
      }

      try {
        await factory.start();
      } catch (error) {
        console.error(
          styleText(
            "red",
            `${sourceFolder.name}: ${base.meta.name} generator failed to initialize`,
          ),
        );
        throw error;
      }
    }
  }

  if (command === "build") {
    for (const sourceFolder of projectSettings.sourceFolders) {
      const { config, baseurl } = sourceFolder;
      const { createPath } = pathResolver(sourceFolder);

      const resolvedRoutes = [];

      {
        const { resolvers } = await routesFactory(sourceFolder, cacheFactory);

        const spinner = spinnerFactory(
          `${sourceFolder.name}: resolving routes`,
        );

        for (const { name, handler } of resolvers.values()) {
          spinner.append(
            `[ ${resolvedRoutes.length + 1} of ${resolvers.size} ] ${name}`,
          );
          resolvedRoutes.push(await handler());
        }

        spinner.succeed("ready ✨");
      }

      const generators = folderGenerators(sourceFolder);
      const plugins = [...(config.plugins || [])];

      for (const base of generators) {
        const factory = base.factory(sourceFolder);
        await factory.build(resolvedRoutes);
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
      const apiGenerator = generators.find((e) => e.meta.slot === "api");

      if (apiGenerator) {
        const dir = createPath.distDir("api");

        // emptyOutDir wont work cause dir is outside project root
        await rm(dir, { recursive: true, force: true });

        const noExternal = Array.isArray(apiGenerator.options?.noExternal)
          ? apiGenerator.options.noExternal
          : generators.flatMap(({ meta }) => {
              return Object.keys({
                ...meta.dependencies,
                ...meta.devDependencies,
              });
            });

        await build({
          configFile: false,
          root: createPath.src(),
          appType: "custom",
          plugins: vitePlugins.api(),
          define: {
            ...config.define,
            KOSMO_PRODUCTION_BUILD: "true",
          },
          ssr: { noExternal },
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

  const requestHandlers: Array<
    [
      segments: [base: string, api?: string],
      matcherFactory: () => RequestMatcher,
      handlerFactory: () => RequestHandler,
    ]
  > = [];

  const teardownHandlers: Array<() => Promise<unknown>> = [];

  const eventMap: Record<string, Awaited<ReturnType<typeof eventFactory>>> = {};

  // WARN: call this before starting any server!
  for (const sourceFolder of projectSettings.sourceFolders) {
    eventMap[sourceFolder.name] = await eventFactory(sourceFolder);
  }

  let port = await findFreePort(devPort);

  // start client servers
  for (const sourceFolder of projectSettings.sourceFolders) {
    const { config, baseurl } = sourceFolder;

    const { createPath } = pathResolver(sourceFolder);
    const requestMatchers = matchersFactory(sourceFolder);

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
      base: join(baseurl, "/"),
      plugins,
      server: {
        ...config.server,
        port: port++,
        middlewareMode: true,
        hmr: { port: port++ },
      },
      resolve: {
        ...config.resolve,
        tsconfigPaths: true,
      },
      define: {
        ...config.define,
      },
      cacheDir: cacheDir(sourceFolder, command, "client"),
    });

    for (const [evt, handler] of Object.entries(eventMap[sourceFolder.name])) {
      viteServer.watcher.on(evt, handler);
    }

    requestHandlers.push([
      [sourceFolder.baseurl],
      () => requestMatchers.base,
      () => viteServer.middlewares,
    ]);

    teardownHandlers.push(viteServer.close);
  }

  // start backend servers
  for (const sourceFolder of projectSettings.sourceFolders) {
    const { config } = sourceFolder;

    if (!folderGenerators(sourceFolder).find((e) => e.meta.slot === "api")) {
      continue;
    }

    const { createPath } = pathResolver(sourceFolder);

    const requestMatchers = matchersFactory(sourceFolder);

    const viteServer = await createServer({
      configFile: false,
      root: createPath.src(),
      appType: "custom",
      server: {
        port: port++,
        middlewareMode: true,
        hmr: { port: port++ },
      },
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

    const env = viteServer.environments.api as RunnableDevEnvironment;

    const loadDevSetup = async () => {
      env.runner.clearCache();
      return env.runner
        .import<{ default: DevSetup }>(join(defaults.apiDir, "dev.ts"))
        .then((e) => e.default);
    };

    let devSetup = await loadDevSetup();

    for (const [evt, handler] of Object.entries(eventMap[sourceFolder.name])) {
      viteServer.watcher.on(evt, async (file) => {
        const mods = env.moduleGraph.getModulesByFile(file);
        if (mods?.size) {
          await handler(file);
          await devSetup?.teardownHandler?.();
          devSetup = await loadDevSetup();
        }
      });
    }

    requestHandlers.push([
      [sourceFolder.baseurl, sourceFolder.apiurl],
      () => devSetup.requestMatcher || requestMatchers.api,
      () => devSetup.requestHandler(),
    ]);

    teardownHandlers.push(viteServer.close);
  }

  /**
   * Sorting is essential to ensure more specific paths are matched before broader ones.
   *
   * Given source folders:
   *   - main app:  baseurl=/  apiurl=/api
   *   - admin app: baseurl=/admin  apiurl=/admin/api
   *
   * Correct sort order:
   *   1. /admin/api  — most specific
   *   2. /api
   *   3. /admin
   *   4. /
   * */
  const requestHandlerWeight = ([
    segments,
  ]: (typeof requestHandlers)[number]) => {
    const [base, api] = segments;
    /**
     * set weight to number of non-empty segments:
     * "/" weight is 0
     * "/admin" weight is 1
     * */
    const weight = base.split("/").filter(Boolean).length;
    return api ? weight + 5 : weight;
  };

  const handlers = requestHandlers.sort(
    (a, b) => requestHandlerWeight(b) - requestHandlerWeight(a),
  );

  const httpServer = http.createServer((req, res) => {
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
    coreGenerator(),
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
  Record<"add" | "change" | "unlink", (f: string) => Promise<void>>
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
    const factory = base.factory(sourceFolder);
    generators.push({ name: base.meta.name, factory });
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
        await factory.watch(entries, event);
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
    async add(file: string) {
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

    async change(file: string) {
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
      resolvers.delete(file);
      resolvedRoutes.delete(file);
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

  if (maxPort >= 65000) {
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
