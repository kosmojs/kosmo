import { writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { styleText } from "node:util";
import { Worker } from "node:worker_threads";

import type { Plugin, ResolvedConfig } from "vite";

// NOTE: keep this as an external export for workers to be able to load it!
import stubGenerator from "@kosmojs/dev/stub-generator";

import { routesFactory } from "../routes-factory";
import type { PluginOptions, PluginOptionsResolved } from "../types";
import apiHandlerFactory from "./api-handler";
import { type SpinnerFactory, spinnerFactory, withSpinner } from "./spinner";
import type { WorkerData, WorkerError, WorkerSpinner } from "./worker";

export default (apiurl: string, pluginOptions?: PluginOptions): Plugin => {
  const outDirSuffix = "client";

  const store: {
    config: ResolvedConfig;
    resolvedOptions: PluginOptionsResolved;
  } = {} as typeof store;

  const createWorker = () => {
    // Destructuring to separate common options from function-based ones.
    // Functions (e.g. generators) can't be passed to worker threads.
    const { generators = [], ...restOptions } = store.resolvedOptions;

    const generatorModules: WorkerData["generatorModules"] = generators.map(
      (e) => [e.moduleImport, e.moduleConfig],
    );

    const workerData: WorkerData = {
      ...restOptions,
      generatorModules,
    };

    return new Worker(resolve(import.meta.dirname, "base-plugin/worker.js"), {
      workerData,
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    });
  };

  const workerHandler = (
    onReady?: () => Promise<void>,
    onExit?: () => Promise<void>,
  ) => {
    const worker = createWorker();

    const spinnerMap = new Map<string, SpinnerFactory>();

    worker.on("error", async (error) => {
      console.error(error);
    });

    worker.on("exit", async () => {
      await onExit?.();
      // TODO: revive worker only if it exited due to an error.
      // Note: worker.terminate() triggers an exit with code 1,
      // so it's not always possible to distinguish normal termination from a crash.
    });

    worker.on(
      "message",
      async (msg: { spinner?: WorkerSpinner; error?: WorkerError }) => {
        if (msg?.spinner) {
          const { id, startText, method, text } = msg.spinner;
          withSpinner(
            startText,
            (spinner) => {
              spinnerMap.set(id, spinner);
              spinner[method](text || "");
              if (method === "succeed" || method === "failed") {
                spinnerMap.delete(id);
              }
            },
            spinnerMap.get(id),
          );
        } else if (msg?.error) {
          const { error } = msg;
          if (error.stack) {
            const [message, ...stack] = error.stack.split("\n");
            console.error(styleText("red", message));
            console.error(stack.join("\n"));
          } else if (error?.message) {
            console.error(`${styleText("red", error?.name)}: ${error.message}`);
          } else {
            console.error(error);
          }
        }
      },
    );

    const readyHandler = async (msg: string) => {
      if (msg === "ready") {
        worker.off("message", readyHandler);
        await onReady?.();
      }
    };

    worker.on("message", readyHandler);

    return async () => {
      await worker.terminate();
    };
  };

  return {
    name: "@kosmojs:basePlugin",

    config(config) {
      if (!config.build?.outDir) {
        throw new Error("Incomplete config, missing build.outDir");
      }
      return {
        build: {
          outDir: join(config.build.outDir, outDirSuffix),
          manifest: true,
        },
      };
    },

    async configResolved(_config) {
      store.config = _config;

      const appRoot = resolve(store.config.root, "../..");
      const sourceFolder = basename(store.config.root);

      // removing outDirSuffix
      const outDir = resolve(appRoot, resolve(store.config.build.outDir, ".."));

      const { stabilityThreshold = 1000 } =
        typeof store.config.server.watch?.awaitWriteFinish === "object"
          ? store.config.server.watch.awaitWriteFinish
          : {};

      const watcher: PluginOptionsResolved["watcher"] = {
        delay: stabilityThreshold,
        ...(store.config.server.watch
          ? { options: store.config.server.watch }
          : {}),
      };

      {
        const { generators = [], refineTypeName = "TRefine" } = {
          ...pluginOptions,
        };

        const apiGenerator = generators.find((e) => e.slot === "api");
        const fetchGenerator = generators.find((e) => e.slot === "fetch");
        const ssrGenerator = generators.find((e) => e.slot === "ssr");

        store.resolvedOptions = {
          ...pluginOptions,
          command: store.config.command,
          watcher,
          generators: [
            // 1. stub generator should run first
            stubGenerator(),
            // 2. then api generator
            ...(apiGenerator ? [apiGenerator] : []),
            // 3. then fetch generator, only if api generator also enabled
            ...(fetchGenerator && apiGenerator ? [fetchGenerator] : []),
            // 4. user generators in the order they were added
            ...generators.filter((e) => {
              return e.slot //
                ? !["api", "fetch", "ssr"].includes(e.slot)
                : true;
            }),
            // 5. ssr generator should run last
            ...(ssrGenerator ? [ssrGenerator] : []),
          ],
          refineTypeName,
          baseurl: store.config.base,
          apiurl,
          appRoot,
          sourceFolder,
          outDir,
        };
      }

      const packageJsonFile = resolve(appRoot, "package.json");

      const packageJson = await import(packageJsonFile, {
        with: { type: "json" },
      }).then((e) => e.default);

      const newDependencies: Array<
        ["dependencies" | "devDependencies", string, string]
      > = [];

      for (const generator of store.resolvedOptions.generators) {
        for (const key of ["dependencies", "devDependencies"] as const) {
          for (const [pkg, ver] of Object.entries(generator[key] || {})) {
            if (!packageJson[key]?.[pkg]) {
              newDependencies.push([key, pkg, ver]);
            }
          }
        }
      }

      if (newDependencies.length) {
        console.warn();
        console.warn(
          [
            "💡 ",
            styleText(["bold", "italic", "red"], "New dependencies added: "),
            styleText("dim", newDependencies.map(([, pkg]) => pkg).join(", ")),
          ].join(""),
        );
        console.warn(
          "📦",
          [
            styleText(
              ["bold", "blueBright"],
              store.config.command === "build"
                ? "Install them and run a new build: "
                : "Install them and restart dev server: ",
            ),
            styleText(
              "dim",
              ["npm", "pnpm", "yarn"]
                .map((e) => `\`${e} install\``)
                .join(" / "),
            ),
          ].join(""),
        );
        console.warn();

        for (const [key, pkg, ver] of newDependencies) {
          packageJson[key] = { ...packageJson[key], [pkg]: ver };
        }

        await writeFile(
          packageJsonFile,
          JSON.stringify(packageJson, null, 2),
          "utf8",
        );
      }

      if (store.config.command === "build") {
        const { resolvers } = await routesFactory(store.resolvedOptions);
        const resolvedEntries = [];

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

        {
          const spinner = spinnerFactory("Running Generators");

          for (const { name, factory } of store.resolvedOptions.generators) {
            spinner.append(name);
            const { build } = await factory(store.resolvedOptions);
            await build(resolvedEntries);
          }

          spinner.succeed();
        }
      }
    },

    async configureServer(server) {
      if (store.config.command !== "serve") {
        return;
      }

      if (!store.resolvedOptions.generators.find((e) => e.slot === "api")) {
        return;
      }

      const apiHandler = await apiHandlerFactory(store.resolvedOptions);

      const apiWatcher = await apiHandler.watcher();

      const stopWorker = workerHandler(
        async () => {
          await apiWatcher.start();
        },
        async () => {
          await apiWatcher.stop();
        },
      );

      // Attach the dev middleware from apiHandler. It may intercept requests to
      // determine whether they should be handled by Vite or by another handler.
      server.middlewares.use(apiHandler.devMiddleware);

      // clean up when Vite dev server closes/restarts
      server.httpServer?.on("close", stopWorker);
    },
  };
};
