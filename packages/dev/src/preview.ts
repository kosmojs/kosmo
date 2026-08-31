import { type ChildProcess, spawn } from "node:child_process";
import { basename, relative, sep } from "node:path";
import { styleText } from "node:util";

import { watch } from "chokidar";

import type { ProjectSettings, SourceFolder } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { deployRunner, runnerPath, writeFolderManifest } from "./runner";

// coalesce the burst of events an editor save produces into one rebuild
const DEBOUNCE_MS = 300;

// editor scratch files - a rebuild for these would only produce the same output
const IGNORED_FILE = /(^\.|~$|\.swp$|\.tmp$)/;

type Build = (sourceFolder: SourceFolder) => Promise<void>;

/**
 * Preview = production build + watcher + `dist/run.js`.
 *
 * The runner is a child process rather than an in-process import:
 * a fresh process is the only way to reload an ESM graph, and it is exactly
 * what production does - `node dist/run.js`.
 *
 * Watching is chokidar over the `src/<folder>` trees - no Vite server,
 * no module graph: the unit of work is "rebuild this folder", so folder-level
 * granularity is all the watcher needs to provide.
 * */
export const previewFactory = async (
  projectSettings: ProjectSettings,
  build: Build,
): Promise<() => Promise<void>> => {
  const { root, previewPort, sourceFolders } = projectSettings;

  const runner = runnerPath(projectSettings);

  const log = (...args: Array<unknown>) => {
    // biome-ignore lint: console
    console.log(styleText("dim", "[preview]"), ...args);
  };

  let child: ChildProcess | undefined;

  const startRunner = () => {
    const proc = spawn(
      process.execPath,
      ["--enable-source-maps", runner, "--port", String(previewPort)],
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
    startRunner();
  };

  const dirty = new Set<SourceFolder>();

  let building = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const rebuild = async () => {
    if (building) {
      // picked up by the loop below once the current pass finishes
      return;
    }

    building = true;

    try {
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
            await build(sourceFolder);
            await writeFolderManifest(sourceFolder);
          } catch (error) {
            failed = true;
            console.error(
              styleText("red", `${sourceFolder.name}: build failed`),
            );
            console.error(error);
          }
        }

        await deployRunner(projectSettings);

        if (failed) {
          // the running process serves the previous build from memory; leave it be
          log(styleText("yellow", "keeping previous build running"));
        } else {
          await restartRunner();
        }
      }
    } finally {
      building = false;
    }
  };

  const schedule = (sourceFolder: SourceFolder, file: string) => {
    if (process.env.DEBUG) {
      log(`event ${sourceFolder.name}: ${file} (building: ${building})`);
    }
    if (IGNORED_FILE.test(basename(file))) {
      return;
    }
    dirty.add(sourceFolder);
    clearTimeout(timer);
    timer = setTimeout(rebuild, DEBOUNCE_MS);
  };

  const watchedFolders = sourceFolders.map((sourceFolder) => {
    const { createPath } = pathResolver(sourceFolder);
    return { dir: createPath.src(), sourceFolder };
  });

  const folderFor = (file: string) => {
    return watchedFolders.find(({ dir }) => {
      return file === dir || file.startsWith(dir + sep);
    })?.sourceFolder;
  };

  const watcher = watch(
    watchedFolders.map(({ dir }) => dir),
    { ignoreInitial: true },
  );

  watcher.on("all", (_event, file) => {
    const sourceFolder = folderFor(file);
    if (sourceFolder) {
      schedule(sourceFolder, file);
    }
  });

  watcher.on("error", (error) => {
    console.error(styleText("red", "watcher failed"));
    console.error(error);
  });

  for (const { dir } of watchedFolders) {
    log(`watching ${styleText("blue", relative(root, dir))}`);
  }

  startRunner();

  const teardown = async () => {
    clearTimeout(timer);
    await watcher.close();
    await stopRunner();
  };

  // the runner is a child of this process: take it down with us on a plain kill,
  // not only on the Ctrl-C the terminal already forwards to the whole process group
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, async () => {
      await teardown();
      process.exit(0);
    });
  }

  return teardown;
};
