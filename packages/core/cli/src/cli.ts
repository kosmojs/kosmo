#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

import { createJiti } from "jiti";
import prompts, { type PromptObject } from "prompts";
import { glob } from "tinyglobby";

import {
  defaults,
  type FolderConfig,
  type ProjectSettings,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathExists } from "@kosmojs/lib";

import {
  assertNoError,
  BACKEND_FRAMEWORKS,
  compareDependencies,
  DEFAULT_BASE,
  FRAMEWORKS,
  printUsage,
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
    ssg: { type: "boolean" },
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

const run = async () => {
  const commands = ["folder", "serve", "build"] as const;

  const [command, ...optedFolders] = options.positionals as [
    command: (typeof commands)[number],
    ...optedFolders: Array<string>,
  ];

  assertNoError(() => {
    return !packageJson?.distDir || !packageJson.devPort
      ? "Found package.json but it's missing `distDir` or `devPort` - is this a KosmoJS project?"
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
      await compareDependencies(packageJson, JSON.parse(json));
    }

    return;
  }

  const configFiles = await glob(
    optedFolders.length
      ? optedFolders.map((e) => `${defaults.srcDir}/${e}/kosmo.config.ts`)
      : `${defaults.srcDir}/*/kosmo.config.ts`,
    {
      cwd: root,
      absolute: true,
    },
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

  const settings: ProjectSettings = {
    root,
    command,
    sourceFolders: [],
    devPort: packageJson.devPort,
  };

  for (const file of configFiles) {
    const config = await jiti.import<FolderConfig>(file, { default: true });

    const { baseurl, apiurl } = await jiti.import<{
      baseurl: string;
      apiurl: string;
    }>(resolve(dirname(file), "config/index.ts"));

    settings.sourceFolders.push({
      name: basename(dirname(file)),
      config: { ...config },
      root,
      baseurl,
      apiurl,
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
      ["backend", BACKEND_FRAMEWORKS],
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

  const onState: PromptObject["onState"] = (state) => {
    if (state.aborted) {
      process.nextTick(() => process.exit(1));
    }
  };

  const folder = await prompts<keyof SourceFolder>([
    {
      type: "text",
      name: "name",
      message: "Folder Name",
      onState,
      validate: (name) => validateName(name) || true,
    },

    {
      type: "text",
      name: "base",
      message: "Base URL",
      initial: DEFAULT_BASE,
      onState,
      validate: (base) => validateBase(base || DEFAULT_BASE) || true,
    },

    {
      type: "select",
      name: "backend",
      message: "Backend Framework",
      onState,
      choices: [
        ...Object.entries(BACKEND_FRAMEWORKS).map(([value, title]) => {
          return { value, title };
        }),
        { value: "none", title: "None (client-only folder)" },
      ],
    },

    {
      type: "select",
      name: "framework",
      message: "Framework",
      onState,
      choices: [
        ...Object.entries(FRAMEWORKS).map(([value, title]) => {
          return { value, title };
        }),
        { value: "none", title: "None (API-only folder)" },
      ],
    },

    {
      type: (prev: SourceFolder["framework"]) => {
        return ["none", "mdx"].includes(prev as never) // skip if...
          ? undefined
          : "toggle";
      },
      name: "ssr",
      message: "Enable server-side rendering (SSR)?",
      initial: false,
      active: "yes",
      inactive: "no",
    },

    {
      type: (prev: SourceFolder["framework"]) => {
        return ["mdx"].includes(prev as never) // only if...
          ? "toggle"
          : undefined;
      },
      name: "ssg",
      message: "Enable server-side generation (SSG)?",
      initial: false,
      active: "yes",
      inactive: "no",
    },
  ]);

  await createSourceFolder(root, folder);

  return folder as SourceFolder;
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
