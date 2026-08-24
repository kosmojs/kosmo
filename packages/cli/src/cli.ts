#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import * as prompts from "@clack/prompts";
import { createJiti } from "jiti";
import { glob } from "tinyglobby";

import {
  BACKENDS,
  defaults,
  FRAMEWORKS,
  type ProjectSettings,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathExists, spinnerFactory } from "@kosmojs/lib";

import {
  assertNoError,
  compareDependencies,
  installHintText,
  introText,
  newDependenciesText,
  printUsage,
  readyText,
  type SourceFolder,
  validateBase,
  validateName,
} from "./base";
import { createSourceFolder } from "./factory";

const options = parseArgs({
  options: {
    name: { type: "string" },
    base: { type: "string" },
    backend: { type: "string" },
    framework: { type: "string" },
    ssr: { type: "boolean" },
    tsq: { type: "boolean" },
    quiet: { type: "boolean", short: "q" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
  strict: true,
});

if (options.values.help) {
  printUsage();
  process.exit(0);
}

const root = process.cwd();

const jiti = createJiti(root);

const packageFile = resolve(root, "package.json");
const packageFileExists = await pathExists(packageFile);

const packageJson = packageFileExists
  ? await import(packageFile, { with: { type: "json" } }).then((e) => e.default)
  : undefined;

// Resolve a clack prompt, exiting cleanly on ctrl-c / escape
const answer = async <T>(input: Promise<T | symbol>) => {
  const value = await input;
  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled");
    process.exit(0);
  }
  return value;
};

const run = async () => {
  const commands = ["folder", "serve", "build", "typecheck"] as const;

  const [command, ...optedFolders] = options.positionals as [
    command: (typeof commands)[number],
    ...optedFolders: Array<string>,
  ];

  assertNoError(() => {
    return !packageJson?.distDir || !packageJson.devPort
      ? "package.json does not exist or some of `distDir` / `devPort` is not set"
      : undefined;
  });

  assertNoError(() => {
    return !commands.includes(command)
      ? `Invalid command, use one of ${commands.join(", ")}`
      : undefined;
  });

  if (command === "folder") {
    await createFolder();

    if (!options.values.quiet) {
      // Using readFile instead of import() because reimporting returns
      // cached content, and adding a cache-busting query string causes
      // Vite's module runner to treat JSON as JavaScript, failing to parse
      const json = await readFile(packageFile, "utf8");

      const newDependencies = compareDependencies(
        packageJson,
        JSON.parse(json),
      );

      if (newDependencies.length) {
        prompts.log.info(
          [newDependenciesText(newDependencies), installHintText()].join("\n"),
        );
      } else {
        prompts.outro(readyText());
      }
    }

    return;
  }

  const configFiles = await glob(
    optedFolders.length
      ? optedFolders.map((e) => `${defaults.srcDir}/${e}/kosmo.config.ts`)
      : `${defaults.srcDir}/*/kosmo.config.ts`,
    { cwd: root, absolute: true },
  );

  assertNoError(() => {
    if (optedFolders.length) {
      return optedFolders.length !== configFiles.length
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
    devPort: packageJson.devPort,
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

const createFolder = async () => {
  if ("name" in options.values) {
    // non-interactive mode

    assertNoError(() => validateName(options.values.name));
    assertNoError(() => validateBase(options.values.base));

    for (const [key, values] of [
      ["framework", FRAMEWORKS],
      ["backend", BACKENDS],
    ] as const) {
      if (options.values[key]) {
        assertNoError(() => {
          return !Object.keys(values).includes(options.values[key] as never)
            ? `Invalid ${key}, use one of: ${Object.keys(values).join(", ")}`
            : undefined;
        });
      }
    }

    const folder = options.values as SourceFolder;

    await createSourceFolder(root, folder);

    return folder;
  }

  // interactive mode

  if (!options.values.quiet) {
    prompts.intro(introText());
  }

  const name = await answer(
    prompts.text({
      message: "Folder Name",
      validate: validateName,
    }),
  );

  const base = await answer(
    prompts.text({
      message: "Base URL",
      initialValue: "/",
      validate: (base) => validateBase(base || "/"),
    }),
  );

  const backend = (await answer(
    prompts.select({
      message: "Backend Framework",
      options: [
        ...Object.entries(BACKENDS).map(([value, label]) => {
          return { value, label };
        }),
        { value: "none", label: "None (client-only folder)" },
      ],
    }),
  )) as SourceFolder["backend"];

  const framework = (await answer(
    prompts.select({
      message: "Framework",
      options: [
        ...Object.entries(FRAMEWORKS).map(([value, label]) => {
          return { value, label };
        }),
        { value: "none", label: "None (API-only folder)" },
      ],
    }),
  )) as SourceFolder["framework"];

  // SSR and TanStack Query only apply to frameworks with a client runtime
  const promptExtras = !["none", "mdx"].includes(framework as never);

  let ssr: boolean | undefined;
  let tsq: boolean | undefined;

  if (promptExtras) {
    ssr = await answer(
      prompts.confirm({
        message: "Enable server-side rendering (SSR)?",
        initialValue: false,
        active: "yes",
        inactive: "no",
      }),
    );

    tsq = await answer(
      prompts.confirm({
        message: "Enable TanStack Query?",
        initialValue: false,
        active: "yes",
        inactive: "no",
      }),
    );
  }

  const folder: SourceFolder = {
    name,
    base,
    ...(backend ? { backend } : {}),
    ...(framework ? { framework } : {}),
    ...(ssr ? { ssr } : {}),
    ...(tsq ? { tsq } : {}),
  };

  await createSourceFolder(root, folder);

  return folder;
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
