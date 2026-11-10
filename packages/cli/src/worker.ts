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

  // preview registers its own handlers, serve leaves that to the caller
  if (handles) {
    exitWith(handles.teardown);
  }
};

await run().catch(reportError);
