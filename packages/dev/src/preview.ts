import { type ChildProcess, spawn } from "node:child_process";
import { connect } from "node:net";
import { basename, posix, relative } from "node:path";
import { styleText } from "node:util";

import { watch } from "chokidar";

import type { ProjectSettings, SourceFolder } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { deployRunner, runnerPath, writeFolderManifest } from "./runner";
import type { DisposableServerHandles } from "./types";

// coalesce the burst of events an editor save produces into one rebuild
const DEBOUNCE_MS = 300;

// editor scratch files - a rebuild for these would only produce the same output
const IGNORED_FILE = /(^\.|~$|\.swp$|\.tmp$)/;

// a build plus the runner's own startup; generous so a cold build on CI fits
const READY_TIMEOUT_MS = 30_000;

type Build = (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
) => Promise<void>;

/**
 * Resolves once the runner accepts TCP connections on host:port,
 * rejects if it exits first or does not come up in time.
 * `spawn` returns before the child has bound its port,
 * and a request sent in that gap is refused.
 * */
const waitForRunner = (proc: ChildProcess, host: string, port: number) => {
  return new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + READY_TIMEOUT_MS;

    let settled = false;

    const settle = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      proc.off("exit", onExit);
      error ? reject(error) : resolve();
    };

    const onExit = (code: number | null, signal: string | null) => {
      settle(new Error(`runner exited before listening (${signal ?? code})`));
    };

    proc.once("exit", onExit);

    const attempt = () => {
      const socket = connect({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        settle();
      });
      socket.once("error", () => {
        socket.destroy();
        if (settled) {
          return;
        }
        if (Date.now() > deadline) {
          settle(new Error(`runner not listening on ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 100);
      });
    };

    attempt();
  });
};

/**
 * Preview = production build + watcher + `dist/run.js`.
 *
 * The runner is a child process rather than an in-process import:
 * a fresh process is the only way to reload an ESM graph,
 * and it is exactly what production does - `node dist/run.js`.
 *
 * Watching is chokidar over the `src/<folder>` trees - no Vite server,
 * no module graph: the unit of work is "rebuild this folder", so folder-level
 * granularity is all the watcher needs to provide.
 * */
export const previewFactory = async (
  projectSettings: ProjectSettings,
  build: Build,
  opts?: {
    /**
     * `kosmo preview` owns the process: it exits on SIGINT/SIGTERM,
     * and a runner that fails to start is logged, not thrown, so a fixing save can recover.
     * Off when embedded (the test harness): no signal handlers, startup failures throw.
     * */
    standalone?: boolean;
  },
): Promise<DisposableServerHandles> => {
  const { standalone = true } = { ...opts };

  const { root, previewHost, sourceFolders } = projectSettings;

  const runner = runnerPath(projectSettings);

  const log = (...args: Array<unknown>) => {
    // biome-ignore lint: console
    console.log(styleText("dim", "[preview]"), ...args);
  };

  let child: ChildProcess | undefined;

  // resolves once the new runner is listening
  const startRunner = () => {
    const [host, port] = previewHost.split(":");

    const proc = spawn(
      process.execPath,
      ["--enable-source-maps", runner, "--host", host, "--port", port],
      { cwd: root, stdio: "inherit" },
    );

    proc.on("exit", (code, signal) => {
      // a replaced runner exits on our SIGTERM - only report the unexpected
      if (child === proc) {
        child = undefined;
        log(styleText("red", `runner exited (${signal ?? code})`));
      }
    });

    child = proc;

    return waitForRunner(proc, host, Number(port));
  };

  const stopRunner = () => {
    return new Promise<void>((resolve) => {
      const proc = child;

      if (!proc || proc.exitCode !== null) {
        child = undefined;
        resolve();
        return;
      }

      child = undefined;
      proc.once("exit", () => resolve());
      proc.kill("SIGTERM");
    });
  };

  const restartRunner = async () => {
    await stopRunner();
    await startRunner();
  };

  const dirty = new Set<SourceFolder>();

  // the rebuild loop currently running, if any
  let inflight: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const drain = async () => {
    // a save landing mid-build re-enters the loop instead of being lost.
    // This also covers the build seeding a just-created empty route file:
    // the second pass finds it non-empty, writes nothing, and the loop ends.
    while (dirty.size) {
      const folders = [...dirty];
      dirty.clear();

      let failed = false;

      for (const sourceFolder of folders) {
        log(`rebuilding ${styleText("blue", sourceFolder.name)}`);
        try {
          await build(projectSettings, sourceFolder);
          await writeFolderManifest(projectSettings, sourceFolder);
        } catch (error) {
          failed = true;
          console.error(styleText("red", `${sourceFolder.name}: build failed`));
          console.error(error);
        }
      }

      await deployRunner(projectSettings);

      if (failed) {
        // the running process serves the previous build from memory; leave it be
        log(styleText("yellow", "keeping previous build running"));
      } else {
        await restartRunner().catch((error) => {
          console.error(styleText("red", "runner failed to start"));
          console.error(error);
        });
      }
    }
  };

  // one loop at a time; callers arriving mid-build share its promise
  const rebuild = () => {
    if (!inflight && dirty.size) {
      // cleared in .finally(), which always runs after this assignment
      inflight = drain().finally(() => {
        inflight = undefined;
      });
    }
    return inflight;
  };

  const schedule = (sourceFolder: SourceFolder, file: string) => {
    if (process.env.DEBUG) {
      log(`event ${sourceFolder.name}: ${file} (building: ${!!inflight})`);
    }
    if (IGNORED_FILE.test(basename(file))) {
      return;
    }
    dirty.add(sourceFolder);
    clearTimeout(timer);
    timer = setTimeout(rebuild, DEBOUNCE_MS);
  };

  const watchedFolders = sourceFolders.flatMap((sourceFolder) => {
    if (sourceFolder.config.frontend || sourceFolder.config.backend) {
      const { createPath } = pathResolver(projectSettings, sourceFolder);
      return [{ dir: createPath.src(), sourceFolder }];
    }
    return [];
  });

  if (!watchedFolders.length) {
    return {
      restart: async () => {},
      teardown: async () => {},
    };
  }

  const watcher = watch(
    watchedFolders.map(({ dir }) => dir),
    { ignoreInitial: true },
  );

  watcher.on("all", (_event, path) => {
    const { sourceFolder } =
      watchedFolders.find(({ dir }) => {
        return path === dir || path.startsWith(posix.join(dir, "/"));
      }) || {};
    if (sourceFolder) {
      schedule(sourceFolder, path);
    }
  });

  watcher.on("error", (error) => {
    console.error(styleText("red", "watcher failed"));
    console.error(error);
  });

  for (const { dir } of watchedFolders) {
    log(`watching ${styleText("blue", relative(root, dir))}`);
  }

  const restart = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
      if (dirty.size) {
        await rebuild();
      }
    }
    await inflight;
  };

  const teardown = async () => {
    clearTimeout(timer);
    await watcher.close();
    await inflight;
    await stopRunner();
  };

  try {
    await startRunner();
  } catch (error) {
    if (!standalone) {
      await teardown();
      throw error;
    }
    // the watcher stays up: a save that fixes the cause rebuilds and starts it again
    console.error(styleText("red", "runner failed to start"));
    console.error(error);
  }

  if (standalone) {
    // the runner is a child of this process: take it down with us on a plain kill,
    // not only on the Ctrl-C the terminal already forwards to the whole process group
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, async () => {
        await teardown();
        process.exit(0);
      });
    }
  }

  return { restart, teardown };
};
