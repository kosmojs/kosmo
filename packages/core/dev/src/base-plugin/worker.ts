import { parentPort, workerData } from "node:worker_threads";

import chokidar from "chokidar";
import crc from "crc/crc32";

import { pathResolver } from "@/paths";
import { routesFactory } from "@/routes-factory";
import { isRouteFile, type ResolverSignature } from "@/routes-factory/resolve";
import type {
  GeneratorConstructor,
  PluginOptionsResolved,
  ResolvedEntry,
  WatcherEvent,
  WatchHandler,
} from "@/types";

import type { SpinnerFactory } from "./spinner";

export type WorkerData = Omit<PluginOptionsResolved, "generators"> & {
  generatorModules: Array<[string, unknown]>;
};

export type WorkerSpinner = {
  id: string;
  startText: string;
  method: keyof SpinnerFactory;
  text?: string | undefined;
};

export type WorkerError = {
  name: string;
  message: string;
  stack?: string;
};

const { generatorModules, ...restOptions } = workerData as WorkerData;

const generators: Array<GeneratorConstructor> = [];

for (const [path, opts] of generatorModules) {
  generators.push(await import(path).then((m) => m.default(opts)));
}

const resolvedOptions: PluginOptionsResolved = {
  ...restOptions,
  generators,
};

const { appRoot, sourceFolder } = resolvedOptions;

const watchHandlers: Array<{ name: string; handler: WatchHandler }> = [];

const resolvedEntries = new Map<
  string, // fileFullpath
  ResolvedEntry
>();

const { resolvers, resolversFactory } = await routesFactory(resolvedOptions);

const spinnerFactory = (startText: string) => {
  const id = [startText, Date.now().toString()].map(crc).join(":");

  const postMessage = (
    method: keyof SpinnerFactory,
    text?: string | undefined,
  ) => {
    const spinner: WorkerSpinner = { id, startText, method, text };
    parentPort?.postMessage({ spinner });
  };

  const postError = (error: Error) => {
    parentPort?.postMessage({ error: structuredClone(error) });
  };

  return {
    id,
    startText,
    text(text: string) {
      postMessage("text", text);
    },
    append(text: string) {
      postMessage("append", text);
    },
    succeed(text?: string) {
      postMessage("succeed", text);
    },
    failed(error: Error) {
      postError(error);
      postMessage("failed", error?.stack || error?.message);
    },
  };
};

const createEventHandler = async (file: string) => {
  const [resolver] = resolversFactory([file]).values();
  if (resolver) {
    const spinner = spinnerFactory(`Resolving ${resolver.name} Route`);
    try {
      const resolvedEntry = await resolver.handler();
      resolvers.set(file, resolver);
      resolvedEntries.set(resolvedEntry.entry.fileFullpath, resolvedEntry);
      spinner.succeed();
    } catch (
      // biome-ignore lint: any
      error: any
    ) {
      spinner.failed(error);
    }
  }
};

const updateEventHandler = async (file: string) => {
  const relatedResolvers = new Map<
    string, // fileFullpath
    ResolverSignature
  >();

  if (resolvedEntries.has(file)) {
    // some route updated
    const resolver = resolvers.get(file);
    if (resolver) {
      relatedResolvers.set(file, resolver);
    }
  } else {
    // checking if changed file is referenced by any routes
    const referencedRoutes = resolvedEntries
      .values()
      .flatMap(({ kind, entry }) => {
        return kind === "apiRoute"
          ? entry.referencedFiles.includes(file)
            ? [entry]
            : []
          : [];
      });
    for (const route of referencedRoutes) {
      const resolver = resolvers.get(route.fileFullpath);
      if (resolver) {
        relatedResolvers.set(route.fileFullpath, resolver);
      }
    }
  }

  let spinner = spinnerFactory(`Updating ${relatedResolvers.size} Routes`);

  for (const resolver of relatedResolvers.values()) {
    spinner.append(resolver.name);
    try {
      const resolvedEntry = await resolver.handler(file);
      resolvedEntries.set(resolvedEntry.entry.fileFullpath, resolvedEntry);
    } catch (
      // biome-ignore lint: any
      error: any
    ) {
      spinner.failed(error);
      spinner = spinnerFactory(`Updating ${relatedResolvers.size} Routes`);
    }
  }

  spinner.succeed();
};

const deleteEventHandler = async () => {
  // TODO: cleanup related files in libDir
};

const runWatchHandlers = async (event?: WatcherEvent) => {
  let spinner = spinnerFactory("Running Generators");

  /**
   * Watch handlers receive the full list of entries
   * and should process only those whose source file or dependencies were updated.
   */
  const entries = Array.from(resolvedEntries.values());

  for (const { name, handler } of watchHandlers) {
    spinner.append(name);
    try {
      // using structuredClone to make sure no generator would alter routes
      await handler(structuredClone(entries), event);
    } catch (
      // biome-ignore lint: any
      error: any
    ) {
      spinner.failed(error);
      spinner = spinnerFactory("Running Generators");
    }
  }

  spinner.succeed();
};

const { createPath } = pathResolver({ appRoot, sourceFolder });

const watcher = chokidar.watch(
  [
    // watching for changes in sourceFolder's apiDir and pagesDir
    createPath.api(),
    createPath.pages(),
  ],
  {
    ...resolvedOptions.watcher.options,
    awaitWriteFinish:
      typeof resolvedOptions.watcher.options?.awaitWriteFinish === "object"
        ? resolvedOptions.watcher.options.awaitWriteFinish
        : {
            stabilityThreshold: resolvedOptions.watcher.delay,
            pollInterval: Math.floor(resolvedOptions.watcher.delay / 4),
          },
    // Do Not emit "add" event for existing files
    ignoreInitial: true,
    // Not using Chokidar's `ignored` option.
    // Instead, allow all events through and filter them manually as needed.
  },
);

watcher.on("all", async (event, file) => {
  if (event.endsWith("Dir")) {
    // skipping folder events
    return;
  }

  if (!isRouteFile(file, { appRoot, sourceFolder })) {
    // not a route file
    return;
  }

  const match = (
    {
      add: { handler: createEventHandler, kind: "create" },
      change: { handler: updateEventHandler, kind: "update" },
      unlink: { handler: deleteEventHandler, kind: "delete" },
    } as const
  )[event as string];

  if (match) {
    const { handler, kind } = match;

    /**
     * This handler is responsible for updating `resolvedRoutes`
     * before they are passed to generators.
     * */
    await handler(file);

    await runWatchHandlers({ kind, file });
  }
});

{
  let spinner = spinnerFactory("Resolving Routes");

  for (const { name, handler } of resolvers.values()) {
    spinner.append(
      `[ ${resolvedEntries.size + 1} of ${resolvers.size} ] ${name}`,
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

{
  let spinner = spinnerFactory("Initializing Generators");

  for (const { name, factory } of generators) {
    spinner.append(name);
    try {
      const { watch } = await factory(resolvedOptions);
      watchHandlers.push({ name, handler: watch });
    } catch (
      // biome-ignore lint: any
      error: any
    ) {
      spinner.failed(error);
      spinner = spinnerFactory("Initializing Generators");
    }
  }

  spinner.succeed();
}

await runWatchHandlers();

parentPort?.postMessage("ready");
