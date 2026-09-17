#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import { createJiti } from "jiti";
import { glob } from "tinyglobby";

import {
  BACKENDS,
  defaults,
  FRONTENDS,
  type GeneratorSignature,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathExists, spinnerFactory } from "@kosmojs/lib";

import {
  assertNoError,
  checkDependencies,
  compareDependencies,
  FOLDER_OPTIONS,
  type PackageJSON,
  packageManager,
  printMessage,
  validateName,
} from "./base";
import {
  createHTTPFolder,
  createSidecarFolder,
  prepareFolder,
  prepareSourceFolder,
} from "./factory";

const COMMANDS = [
  "folder",
  "sidecar",
  "serve",
  "build",
  "preview",
  "typecheck",
] as const;

export const printUsage = () => {
  const usage = [
    "",
    `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
    "",

    styleText("bold", "FOLDER COMMAND"),
    "",
    `  ${styleText("blue", "kosmo folder <name>")}`,
    `  Create <name> Source Folder in interactive mode, prompting for each step`,
    "",
    styleText(
      "bold",
      "  Use these options to create a Source Folder in CLI mode:",
    ),
    `  ${styleText("cyan", `--frontend`)} ${styleText("yellow", Object.keys(FRONTENDS).join("|"))} ${styleText("dim", "(--no-frontend for API-only folders)")}`,
    `  ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(--no-backend for client-only folders use)")}`,
    `  ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,
    "",

    styleText("bold", "SIDECAR COMMAND"),
    "",
    `  ${styleText("blue", "kosmo sidecar <name>")}`,
    `  Create <name> Sidecar Folder - builds a standalone process, serves no routes`,
    "",
    `  ${styleText("dim", "The entry default-exports defineService({ start, teardown }).")}`,
    `  ${styleText("dim", "Set sidecar.serve in kosmo.config.ts to run it under kosmo serve.")}`,
    "",
    `  ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,
    "",

    styleText("bold", "SERVE COMMAND"),
    "",
    `  ${styleText("blue", "kosmo serve")}`,
    `  Start dev server for all source folders`,
    "",
    `  ${styleText("blue", "kosmo serve")} ${styleText("magenta", "admin")}`,
    `  Start dev server for single source folder`,
    "",
    `  ${styleText("blue", "kosmo serve")} ${styleText("magenta", "admin front")}`,
    `  Start dev server for multiple source folders`,
    "",

    styleText("bold", "PREVIEW COMMAND"),
    "",
    `  ${styleText("blue", "kosmo preview")}`,
    `  Build all source folders and serve the build output, rebuilding on change`,
    "",
    `  ${styleText("blue", "kosmo preview")} ${styleText("magenta", "admin front")}`,
    `  Preview selected source folders only`,
    "",

    styleText("bold", "BUILD COMMAND"),
    "",
    `  ${styleText("blue", "kosmo build")}`,
    `  Build all source folders`,
    "",
    `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "admin")}`,
    `  Build single source folder`,
    "",
    `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "admin front")}`,
    `  Build multiple source folders`,
    "",

    styleText("bold", "TYPECHECK COMMAND"),
    "",
    `  ${styleText("blue", "kosmo typecheck")}`,
    `  Typecheck all source folders`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", "admin")}`,
    `  Typecheck single source folder`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", "admin front")}`,
    `  Typecheck multiple source folders`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", ".")}`,
    `  Typecheck the project root only`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", ". admin")}`,
    `  Typecheck the project root along with given folders`,
    "",

    styleText("bold", "COMMON OPTIONS"),
    "",
    `  ${styleText("cyan", "-h, --help")}`,
    `  Display this help message and exit`,
    "",
  ];

  for (const line of usage) {
    console.log(line);
  }
};

const run = async () => {
  const { values, positionals } = parseArgs({
    options: {
      ...FOLDER_OPTIONS,
      overwrite: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const root = process.cwd();

  const jiti = createJiti(root);

  const packageFile = resolve(root, "package.json");
  const packageFileExists = await pathExists(packageFile);

  const packageJson = packageFileExists
    ? await jiti.import<PackageJSON>(packageFile, { default: true })
    : undefined;

  const [command, ...rest] = positionals as [
    command: (typeof COMMANDS)[number],
    ...rest: Array<string>,
  ];

  if (
    !packageJson?.distDir ||
    !packageJson?.devPort ||
    !packageJson?.previewPort
  ) {
    assertNoError(() => {
      return "package.json does not exist or some of `distDir` / `devPort` / `previewPort` is not set";
    });
    // needed for typecheck to pass
    return;
  }

  assertNoError(() => {
    return !COMMANDS.includes(command)
      ? `Unknown command; use one of ${styleText("blue", COMMANDS.join(", "))}`
      : undefined;
  });

  const configFilePattern = (folder: string) => {
    return join(defaults.srcDir, folder, "kosmo.config.ts");
  };

  const scanConfigFiles = async (folderNames: Array<string>) => {
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

  const folderNames = rest.flatMap((e) => (e === "." ? [] : [e]));
  const input = Object.keys(values).length ? values : undefined;

  const createFolder = async () => {
    const [name] = rest;

    assertNoError(() => validateName(name, "No folder name provided"));

    printMessage(
      styleText(["blue", "bold"], "› Preparing a new source folder"),
      "intro",
    );

    const folder = await prepareSourceFolder(root, name, input);

    await createHTTPFolder(root, folder);

    // Using readFile cause import() returns cached content
    const { dependencies, devDependencies } = JSON.parse(
      await readFile(packageFile, "utf8"),
    );

    const newDependencies = compareDependencies(packageJson, {
      dependencies,
      devDependencies,
    });

    if (newDependencies.length) {
      const pm = await packageManager();
      printMessage(
        [
          `💡 ${styleText(["bold", "italic", "red"], "New dependencies added: ")}`,
          styleText("dim", newDependencies.map(([, pkg]) => pkg).join(", ")),
          "",
          `📦 ${styleText(["bold", "blueBright"], "Install them before continue: ")}`,
          pm.command("install"),
        ].join("\n"),
        "note",
      );
    }

    printMessage(
      [
        styleText(["green"], `✨ Well done!`),
        styleText(["blue", "bold"], `./${defaults.srcDir}/${folder.name}`),
        "is ready to perform",
      ].join(" "),
      "outro",
    );

    return;
  };

  const createSidecar = async () => {
    const [name] = rest;

    assertNoError(() => validateName(name, "No sidecar name provided"));

    printMessage(
      styleText(["blue", "bold"], "› Preparing a new sidecar"),
      "intro",
    );

    const sidecar = await prepareFolder(root, name, input);

    printMessage(
      [
        styleText(["green"], `✨ Well done!`),
        styleText(["blue", "bold"], `./${defaults.srcDir}/${sidecar.name}`),
        "sidecar is ready to perform",
      ].join(" "),
      "outro",
    );

    await createSidecarFolder(root, { ...sidecar, sidecar: true });

    return;
  };

  const runTypecheck = async () => {
    const configFiles =
      folderNames.length || !rest.length //
        ? await scanConfigFiles(folderNames)
        : [];

    const require = createRequire(packageFile);
    const pkgFile = require.resolve("typescript/package.json");

    const { default: pkg } = await import(pkgFile, { with: { type: "json" } });

    const tsc = resolve(dirname(pkgFile), pkg.bin.tsc || pkg.bin);

    const runTsc = async (project: string): Promise<string | undefined> => {
      const { error } = await new Promise<{ error?: string }>((resolve) => {
        execFile(
          process.execPath,
          [tsc, "--project", project, "--noEmit", "--pretty"],
          { cwd: dirname(project) },
          (error, stdout) => {
            resolve(error ? { error: stdout } : {});
          },
        );
      });
      return error;
    };

    const projects: Array<[string, boolean]> = [];

    for (const file of configFiles) {
      const { config } = await jiti.import<Pick<SourceFolder, "config">>(file, {
        default: true,
      });
      projects.push([
        `${dirname(file.replace(root, "."))}/tsconfig.json`,
        "typecheck" in config ? config.typecheck : true,
      ]);
    }

    if (rest.includes(".") || !rest.length) {
      projects.push(["./tsconfig.json", true]);
    }

    const errors: Array<string> = [];

    const columns = process.stdout.isTTY
      ? Number(process.stdout.columns || 0)
      : 0;

    const delimiter = styleText(
      "dim",
      styleText("gray", Array(columns).fill("·").join("")),
    );

    for (const [project, typecheck] of projects) {
      console.log(delimiter);
      if (typecheck) {
        const spinner = spinnerFactory(project);
        const error = await runTsc(resolve(root, project));
        if (error) {
          errors.push(error);
          spinner.text(styleText(["black", "bgRed"], ` ${project} `));
          spinner.failed();
          console.error(error);
        } else {
          spinner.text(styleText(["black", "bgGreen"], ` ${project} `));
          spinner.succeed();
        }
      } else {
        spinnerFactory(
          `${project} - ${styleText(["black", "bgYellow"], " SKIP ")}`,
        ).succeed();
      }
    }

    if (errors.length) {
      console.log();
      process.exit(1);
    }

    return;
  };

  const runCommand = async (
    command: ProjectSettings["command"],
    folderNames: Array<string>,
  ) => {
    const configFiles = await scanConfigFiles(folderNames);

    const settings: ProjectSettings = {
      root,
      command,
      sourceFolders: [],
      distDir: packageJson.distDir as never,
      devPort: packageJson.devPort as never,
      previewPort: packageJson.previewPort as never,
    };

    const projectGenerators: Array<GeneratorSignature> = [];

    for (const file of configFiles) {
      const { config, generators, error } = await jiti
        .import<
          Pick<import("@kosmojs/core").SourceFolder, "config" | "generators">
        >(file, {
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

      settings.sourceFolders.push({
        name: basename(dirname(file)),
        config,
        generators,
        root,
        distDir: packageJson.distDir as never,
      });

      projectGenerators.push(...generators);
    }

    await checkDependencies(packageJson, projectGenerators);

    await chassis(settings);

    return;
  };

  if (command === "folder") {
    return createFolder();
  }

  if (command === "sidecar") {
    return createSidecar();
  }

  if (command === "typecheck") {
    return runTypecheck();
  }

  return runCommand(command, folderNames);
};

await run().catch((error) => {
  process.env.DEBUG?.includes("cli")
    ? console.error(error)
    : console.error(error.message);
  process.exit(1);
});
