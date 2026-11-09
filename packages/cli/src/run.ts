import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { styleText } from "node:util";

import type { Jiti } from "jiti";

import { defaults, type SourceFolder } from "@kosmojs/core";
import { spinnerFactory } from "@kosmojs/lib";

import {
  assertFolderName,
  compareDependencies,
  type FolderOptions,
  type PackageJSON,
  packageManager,
  printMessage,
} from "./base";
import {
  createHTTPFolder,
  createSidecarFolder,
  prepareFolder,
  readFolderOptions,
} from "./factory";
import {
  type CliArgs,
  resolveMode,
  runChassis,
  scanConfigFiles,
} from "./project";

/**
 * Commands that do their job and exit, run in the cli process itself.
 * */
export const runCommand = async ({
  root,
  jiti,
  packageFile,
  packageJson,
  args: { values, command, rest, folderNames },
}: {
  root: string;
  jiti: Jiti;
  packageFile: string;
  packageJson: PackageJSON;
  args: CliArgs;
}) => {
  const input = Object.keys(values).length ? values : undefined;

  const createFolder = async () => {
    printMessage(
      styleText(["blue", "bold"], "› Preparing a new source folder"),
      "intro",
    );

    const name = await assertFolderName(values.name);

    const options = await readFolderOptions(name, input);

    await prepareFolder(root, name, input);

    await createHTTPFolder(root, options);

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
        styleText(["blue", "bold"], `./${defaults.srcDir}/${options.name}`),
        "is ready to perform",
      ].join(" "),
      "outro",
    );
  };

  const createSidecar = async () => {
    printMessage(
      styleText(["blue", "bold"], "› Preparing a new sidecar"),
      "intro",
    );

    const name = await assertFolderName(values.name);

    await prepareFolder(root, name, input);

    const options: FolderOptions = { name };

    printMessage(
      [
        styleText(["green"], `✨ Well done!`),
        styleText(["blue", "bold"], `./${defaults.srcDir}/${options.name}`),
        "sidecar is ready to perform",
      ].join(" "),
      "outro",
    );

    await createSidecarFolder(root, { ...options, sidecar: true });
  };

  const runTypecheck = async () => {
    const configFiles =
      folderNames.length || !rest.length //
        ? await scanConfigFiles(root, folderNames)
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

  if (command === "build") {
    await runChassis(command, {
      root,
      jiti,
      packageJson,
      folderNames,
      mode: resolveMode(command, values.mode),
    });
  }
};
