/**
 * Runs `serve` / `preview` on behalf of the supervisor in cli.ts.
 *
 * Spawned with the same argv as the cli, and in a fresh process every time,
 * so package.json, kosmo.config.ts and env files are all read anew.
 * */

import { createJiti } from "jiti";

import {
  loadPackageJson,
  parseCLIArgs,
  reportError,
  resolveMode,
  runChassis,
} from "./project";
import { exitWith } from "./supervisor";

const run = async () => {
  const { values, command, folderNames } = parseCLIArgs(process.argv.slice(2));

  if (command !== "serve" && command !== "preview") {
    throw new Error(`worker cannot run "${command}" command`);
  }

  /**
   * Until the command is up, a stop request ends the worker right away:
   * nothing started by then holds anything that exiting does not release.
   *
   * Without this, a stop request during startup goes unanswered.
   * Libraries loaded on the way register signal handlers that exit the process
   * only when no other listener is there - each one finds the other, and none exits.
   * */
  const exitNow = () => process.exit(0);

  const startupEvents = ["SIGINT", "SIGTERM", "disconnect"] as const;

  for (const event of startupEvents) {
    process.on(event, exitNow);
  }

  // the supervisor may be gone already
  if (process.send && !process.connected) {
    exitNow();
  }

  const root = process.cwd();

  const jiti = createJiti(root);

  const { packageJson } = await loadPackageJson(jiti, root);

  const handles = await runChassis(command, {
    root,
    jiti,
    packageJson,
    folderNames,
    mode: resolveMode(command, values.mode),
  });

  for (const event of startupEvents) {
    process.off(event, exitNow);
  }

  // preview registers its own handlers, serve leaves that to the caller
  if (handles) {
    exitWith(handles.teardown);
  }
};

await run().catch(reportError);
