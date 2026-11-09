import { type ChildProcess, spawn } from "node:child_process";
import { type FSWatcher, watch } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { styleText } from "node:util";

import { envFilesFor } from "@kosmojs/lib";

// editors and package managers write in bursts, restart once per burst
const DEBOUNCE_MS = 300;

// a worker still alive this long after SIGTERM gets SIGKILL
const KILL_TIMEOUT_MS = 5_000;

const label = (root: string, dir: string) => relative(root, dir) || ".";

const log = (...args: Array<unknown>) => {
  console.log(styleText("dim", "[kosmo]"), ...args);
};

/**
 * Keep the worker running `serve` / `preview` in a child process,
 * restarting it when a file it reads only on startup changes:
 * - project root: package.json and env files;
 * - each source folder: kosmo.config.ts and env files.
 *
 * Watched folders are the ones known at startup;
 * a source folder created or removed later requires a manual restart.
 *
 * A worker that exits on its own (failed startup, crash) is not respawned
 * until a watched file changes, so a fixing save brings it back.
 * */
export const supervise = ({
  root,
  worker,
  args,
  mode,
  configFiles,
}: {
  root: string;
  worker: string;
  args: Array<string>;
  mode: string;
  configFiles: Array<string>;
}) => {
  let child: ChildProcess | undefined;
  let exiting = false;

  const start = () => {
    const proc = spawn(
      process.execPath,
      [...process.execArgv, worker, ...args],
      { cwd: root, stdio: "inherit" },
    );

    proc.on("error", (error) => {
      if (child === proc) {
        child = undefined;
      }
      console.error(styleText("red", "Failed to start worker"));
      console.error(error);
    });

    proc.on("exit", (code, signal) => {
      // a worker replaced by stop() is no longer the child, nothing to report
      if (child !== proc) {
        return;
      }
      child = undefined;
      if (!exiting) {
        log(
          styleText("red", `worker exited (${signal ?? code})`),
          styleText("dim", "- waiting for changes to restart"),
        );
      }
    });

    child = proc;
  };

  // resolves once the worker is gone, so its ports are free for the next one
  const stop = () => {
    return new Promise<void>((resolve) => {
      const proc = child;
      child = undefined;

      if (!proc || proc.exitCode !== null || proc.signalCode !== null) {
        resolve();
        return;
      }

      const timer = setTimeout(() => proc.kill("SIGKILL"), KILL_TIMEOUT_MS);

      proc.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });

      proc.kill("SIGTERM");
    });
  };

  const changes = new Set<string>();

  let timer: ReturnType<typeof setTimeout> | undefined;

  // the restart loop currently running, if any
  let restarting: Promise<void> | undefined;

  const restart = async () => {
    // changes landing while the worker stops are picked up by the next round
    while (changes.size && !exiting) {
      const files = [...changes];
      changes.clear();
      log(`${styleText("blue", files.join(", "))} changed, restarting`);
      await stop();
      if (!exiting) {
        start();
      }
    }
  };

  const schedule = (file: string) => {
    changes.add(relative(root, file));
    clearTimeout(timer);
    timer = setTimeout(() => {
      restarting ??= restart().finally(() => {
        restarting = undefined;
      });
    }, DEBOUNCE_MS);
  };

  // the env files loadEnvFiles reads for this mode, in both root and folders
  const envFiles = envFilesFor(mode);

  const targets: Array<[dir: string, files: Set<string>]> = [
    [root, new Set(["package.json", ...envFiles])],
    ...configFiles.map((file): [string, Set<string>] => {
      return [dirname(file), new Set([basename(file), ...envFiles])];
    }),
  ];

  // watching dirs rather than files:
  // catches atomic saves (write temp + rename) and files created later
  const watchers = targets.flatMap(([dir, files]): Array<FSWatcher> => {
    try {
      const watcher = watch(dir, (_event, filename) => {
        // filename is null on platforms not reporting it; nothing to match then
        if (filename && files.has(filename)) {
          schedule(join(dir, filename));
        }
      });
      watcher.on("error", (error) => {
        log(
          styleText("yellow", `stopped watching ${label(root, dir)}`),
          styleText("dim", error.message),
        );
        watcher.close();
      });
      return [watcher];
    } catch (
      // biome-ignore lint: any
      error: any
    ) {
      log(
        styleText("yellow", `cannot watch ${label(root, dir)}`),
        styleText("dim", error.message),
      );
      return [];
    }
  });

  const shutdown = async () => {
    if (exiting) {
      return;
    }
    exiting = true;
    clearTimeout(timer);
    for (const watcher of watchers) {
      watcher.close();
    }
    await restarting;
    await stop();
    process.exit(0);
  };

  // once: a second Ctrl-C hits the default handler and quits at once
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, shutdown);
  }

  start();
};
