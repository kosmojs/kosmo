#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { resolve } from "node:path";

import { createJiti } from "jiti";

import { printUsage } from "./base";
import {
  assertCommand,
  loadPackageJson,
  parseCLIArgs,
  reportError,
  resolveMode,
  scanConfigFiles,
} from "./project";
import { runCommand } from "./run";
import { supervise } from "./supervisor";

const run = async () => {
  const argv = process.argv.slice(2);

  const args = parseCLIArgs(argv);

  if (args.values.help) {
    printUsage();
    process.exit(0);
  }

  const root = process.cwd();

  const jiti = createJiti(root);

  const { packageFile, packageJson } = await loadPackageJson(jiti, root);

  assertCommand(args.command);

  const { command, values, folderNames } = args;

  if (command === "serve" || command === "preview") {
    // validated here, so a wrong folder name fails right away,
    // rather than in a worker that would then wait for changes
    const configFiles = await scanConfigFiles(root, folderNames);
    return supervise({
      root,
      worker: resolve(import.meta.dirname, "worker.js"),
      args: argv,
      mode: resolveMode(command, values.mode),
      configFiles,
    });
  }

  return runCommand({ root, jiti, packageFile, packageJson, args });
};

await run().catch(reportError);
