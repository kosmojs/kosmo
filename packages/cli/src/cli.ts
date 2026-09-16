#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import { createJiti } from "jiti";
import { glob } from "tinyglobby";

import { defaults, type ProjectSettings } from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathExists, spinnerFactory } from "@kosmojs/lib";

import {
  assertNoError,
  checkDependencies,
  compareDependencies,
  FOLDER_OPTIONS,
  type PackageJSON,
  printUsage,
  type SourceFolder,
} from "./base";
import { createFolder } from "./factory";

const COMMANDS = ["folder", "serve", "build", "preview", "typecheck"] as const;

const run = async () => {
  const { values, positionals } = parseArgs({
    options: {
      ...FOLDER_OPTIONS,
      overwrite: { type: "boolean" },
      quiet: { type: "boolean", short: "q" },
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
      ? `Invalid command, use one of ${COMMANDS.join(", ")}`
      : undefined;
  });

  if (command === "folder") {
    const [name] = rest;

    const intro = () => {
      return styleText(
        ["blue", "bold"],
        "› Ready to create a new Source Folder",
      );
    };

    const note = async () => {
      // Using readFile cause import() returns cached content
      const { dependencies, devDependencies } = JSON.parse(
        await readFile(packageFile, "utf8"),
      );

      const newDependencies = compareDependencies(packageJson, {
        dependencies,
        devDependencies,
      });

      if (!newDependencies.length) {
        return;
      }

      return [
        `💡 ${styleText(["bold", "italic", "red"], "New dependencies added: ")}`,
        styleText("dim", newDependencies.map(([, pkg]) => pkg).join(", ")),
        "",
        `📦 ${styleText(["bold", "blueBright"], "Install them before continue: ")}`,
        `$ npm install ${styleText(["dim"], "# pnpm install / yarn install")}`,
      ].join("\n");
    };

    const outro = (folder: SourceFolder) => {
      return [
        styleText(["green"], `✨ Well done! A new Source Folder created:`),
        styleText(["blue", "bold"], `./${defaults.srcDir}/${folder.name}`),
      ].join(" ");
    };

    const input = Object.keys(values).length ? values : undefined;

    if (input) {
      // cli mode
      await createFolder(root, name, {
        input,
        intro: () => "",
        note: () => "",
        outro: async (f: SourceFolder) => {
          const output = outro(f);
          const notes = await note();
          return notes ? [output, notes].join("\n\n") : output;
        },
      });
    } else {
      // interactive mode
      await createFolder(root, name, { intro, note, outro });
    }

    return;
  }

  const folderNames = rest.flatMap((e) => (e === "." ? [] : [e]));

  const configFilePattern = (folder: string) => {
    return join(defaults.srcDir, folder, "kosmo.config.ts");
  };

  const scanConfigFiles = async () => {
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

  if (command === "typecheck") {
    const configFiles =
      folderNames.length || !rest.length //
        ? await scanConfigFiles()
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

    const rootOpted = rest.includes(".");

    const projects: Array<string> = [
      ...configFiles.map((e) => {
        return `${dirname(e.replace(root, "."))}/tsconfig.json`;
      }),
      ...(rootOpted || !rest.length ? ["./tsconfig.json"] : []),
    ];

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
        spinnerFactory(`${project} - ${styleText("yellow", "SKIP")}`).succeed();
      }
    }

    if (errors.length) {
      console.log();
      process.exit(1);
    }

    return;
  }

  const configFiles = await scanConfigFiles();

  const settings: ProjectSettings = {
    root,
    command,
    sourceFolders: [],
    distDir: packageJson.distDir,
    devPort: packageJson.devPort,
    previewPort: packageJson.previewPort,
  };

  for (const file of configFiles) {
    const { config, error } = await jiti
      .import<import("@kosmojs/core").SourceFolder["config"]>(file, {
        default: true,
      })
      .then(
        (config) => {
          return { config, error: undefined };
        },
        (error) => {
          return { config: undefined, error };
        },
      );

    if (!config || error) {
      console.error(
        styleText(["red"], `Failed loading ${file.replace(`${root}/`, "")}`),
      );
      throw new Error(error || "No config defined");
    }

    settings.sourceFolders.push({
      name: basename(dirname(file)),
      config,
      root,
      distDir: packageJson.distDir,
    });
  }

  await chassis(settings);
};

try {
  await run();
} catch (
  // biome-ignore lint: any
  error: any
) {
  console.error(error.message);
  process.exit(1);
}
