import { basename, dirname, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import type { Jiti } from "jiti";
import { glob } from "tinyglobby";

import {
  type ChassisCommand,
  DEFAULT_DIST,
  type GeneratorSignature,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import {
  configFilePattern,
  loadEnvFiles,
  pathExists,
  resolveHostAddress,
} from "@kosmojs/lib";

import {
  assertNoError,
  checkDependencies,
  FOLDER_OPTIONS,
  type PackageJSON,
} from "./base";

export const COMMANDS = [
  "folder",
  "sidecar",
  "serve",
  "build",
  "preview",
  "typecheck",
] as const;

export type Command = (typeof COMMANDS)[number];

export const parseCLIArgs = (args: Array<string>) => {
  const { values, positionals } = parseArgs({
    args,
    options: {
      ...FOLDER_OPTIONS,
      overwrite: { type: "boolean" },
      mode: { type: "string", short: "m" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: true,
  });

  const [command, ...rest] = positionals as [
    command: Command,
    ...rest: Array<string>,
  ];

  // `.` stands for the project root, only meaningful to typecheck
  const folderNames = rest.filter((e) => e !== ".");

  return { values, command, rest, folderNames };
};

export type CliArgs = ReturnType<typeof parseCLIArgs>;

export const assertCommand = (command: string) => {
  assertNoError(() => {
    return !COMMANDS.includes(command as Command)
      ? `Unknown command; use one of ${styleText("blue", COMMANDS.join(", "))}`
      : undefined;
  });
};

// build and preview both default to production; test is not run from the cli
export const resolveMode = (command: ChassisCommand, mode?: string) => {
  return mode || (command === "serve" ? "development" : "production");
};

export const loadPackageJson = async (jiti: Jiti, root: string) => {
  const packageFile = resolve(root, "package.json");

  const packageJson = (await pathExists(packageFile))
    ? await jiti
        .import<PackageJSON>(packageFile, { default: true })
        .catch(() => undefined)
    : undefined;

  assertNoError(() => {
    return packageJson?.kosmo
      ? undefined
      : `package.json does not exist, or it is missing the "kosmo" key`;
  });

  return { packageFile, packageJson: packageJson as PackageJSON };
};

export const scanConfigFiles = async (
  root: string,
  folderNames: Array<string>,
) => {
  const configFiles = await glob(
    folderNames.length
      ? folderNames.map(configFilePattern)
      : configFilePattern("*"),
    { cwd: root, absolute: true, deep: 2 },
  );

  assertNoError(() => {
    if (folderNames.length) {
      return folderNames.length !== configFiles.length
        ? "Some of the given names do not contain a valid KosmoJS source folder"
        : undefined;
    }
    return !configFiles.length //
      ? "No source folders detected"
      : undefined;
  });

  return configFiles;
};

/**
 * Load the given source folders - config, generators, env files -
 * and hand them to the chassis.
 * */
export const runChassis = async <C extends ChassisCommand>(
  command: C,
  {
    root,
    jiti,
    packageJson,
    folderNames,
    mode,
  }: {
    root: string;
    jiti: Jiti;
    packageJson: PackageJSON;
    folderNames: Array<string>;
    mode: string;
  },
): ReturnType<typeof chassis<C>> => {
  const configFiles = await scanConfigFiles(root, folderNames);

  const projectGenerators: Array<GeneratorSignature> = [];

  const settings: ProjectSettings = {
    root,
    mode,
    sourceFolders: [],
    devHost: resolveHostAddress(packageJson.kosmo, "devHost"),
    previewHost: resolveHostAddress(packageJson.kosmo, "previewHost"),
    distDir: packageJson.kosmo?.distDir || DEFAULT_DIST,
  };

  for (const file of configFiles) {
    const { config, generators, error } = await jiti
      .import<Pick<SourceFolder, "config" | "generators">>(file, {
        default: true,
      })
      .then(
        ({ config, generators }) => {
          return { config, generators, error: undefined };
        },
        (error) => {
          return { config: undefined, generators: undefined, error };
        },
      );

    if (!config || error) {
      console.error(
        styleText(["red"], `Failed loading ${file.replace(root, ".")}`),
      );
      throw new Error(error || "No config defined");
    }

    const name = basename(dirname(file));

    const envSources = await loadEnvFiles({ root, name, mode, config });

    settings.sourceFolders.push({
      name,
      config,
      generators,
      envSources,
    });

    projectGenerators.push(...generators);
  }

  await checkDependencies(packageJson, projectGenerators);

  return chassis(command, settings);
};

// biome-ignore lint: any
export const reportError = (error: any) => {
  console.error(
    error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" //
      ? error.message
      : error,
  );
  process.exit(1);
};
