#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import { createJiti } from "jiti";
import { glob } from "tinyglobby";

import { defaults, type ProjectSettings } from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathExists, spinnerFactory } from "@kosmojs/lib";

import {
  assertNoError,
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
    ...optedFolders: Array<string>,
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
      await createFolder(root, {
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
      await createFolder(root, { intro, note, outro });
    }

    return;
  }

  const configFiles = await glob(
    rest.length
      ? rest.map((e) => `${defaults.srcDir}/${e}/kosmo.config.ts`)
      : `${defaults.srcDir}/*/kosmo.config.ts`,
    { cwd: root, absolute: true, deep: 2 },
  );

  assertNoError(() => {
    if (rest.length) {
      return rest.length !== configFiles.length
        ? "Some of given names does not contain a valid KosmoJS source folder"
        : undefined;
    }

    return !configFiles.length //
      ? "No source folders detected"
      : undefined;
  });

  if (command === "typecheck") {
    const spinner = spinnerFactory("Typecheck in progress");

    const require = createRequire(packageFile);
    const pkgDir = dirname(require.resolve("typescript/package.json"));
    const { bin } = require("typescript/package.json");
    const tscBin = join(pkgDir, typeof bin === "string" ? bin : bin.tsc);

    const runTsc = async (cwd: string) => {
      const tsconfig = resolve(cwd, "tsconfig.json");
      spinner.append(relative(root, tsconfig));

      const { error } = await new Promise<{ error?: string }>((r) => {
        execFile(
          process.execPath,
          [tscBin, "--project", tsconfig, "--noEmit", "--pretty"],
          { cwd },
          (error, stdout) => {
            r(error ? { error: stdout } : {});
          },
        );
      });

      if (error) {
        spinner.failed();
        console.error(error);
        process.exit(1);
      }
    };

    for (const file of configFiles) {
      await runTsc(dirname(file));
    }

    spinner.text("Typecheck done ✨");
    spinner.succeed();

    return;
  }

  const settings: ProjectSettings = {
    root,
    command,
    sourceFolders: [],
    distDir: packageJson.distDir,
    devPort: packageJson.devPort,
    previewPort: packageJson.previewPort,
  };

  for (const file of configFiles) {
    const config = await jiti.import<
      import("@kosmojs/core").SourceFolder["config"]
    >(file, { default: true });

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
