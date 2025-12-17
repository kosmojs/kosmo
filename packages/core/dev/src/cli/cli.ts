#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { dirname, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import concurrently from "concurrently";
import prompts, { type PromptObject } from "prompts";
import { glob } from "tinyglobby";

import {
  assertNoError,
  DEFAULT_BASE,
  DEFAULT_PORT,
  FRAMEWORK_OPTIONS,
  messageFactory,
  pathExists,
  type SourceFolder,
  validateBase,
  validateName,
  validatePort,
} from "./base";
import { createSourceFolder } from "./factory";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",

  styleText("bold", "FOLDER COMMAND"),
  "",
  `  ${styleText("blue", "kosmo folder")}`,
  `  Create a new Source Folder in interactive mode, prompting for each step`,
  "",
  styleText(
    "bold",
    "  Use these options to create a Source Folder in non-interactive mode:",
  ),
  "",
  `  ${styleText("cyan", "--name")} ${styleText("dim", "<name>")}`,
  `  Source folder name`,
  "",
  `  ${styleText("cyan", "--base")} ${styleText("dim", "<path>")}`,
  `  Base URL`,
  "",
  `  ${styleText("cyan", "--port")} ${styleText("dim", "<number>")}`,
  `  Development server port`,
  "",
  `  ${styleText("cyan", "--framework")} ${styleText("dim", "<framework>")}`,
  `  Frontend framework: ${FRAMEWORK_OPTIONS.map((e) => styleText("yellow", e)).join(", ")}`,
  "",
  `  ${styleText("cyan", "--ssr")}`,
  `  Enable server-side rendering (SSR)`,
  "",

  styleText("bold", "DEV COMMAND"),
  "",
  `  ${styleText("blue", "kosmo dev")}`,
  `  Start dev server for all source folders`,
  "",
  `  ${styleText("blue", "kosmo dev")} ${styleText("magenta", "@admin")}`,
  `  Start dev server for single source folder`,
  "",
  `  ${styleText("blue", "kosmo dev")} ${styleText("magenta", "@admin @front")}`,
  `  Start dev server for multiple source folders`,
  "",

  styleText("bold", "BUILD COMMAND"),
  "",
  `  ${styleText("blue", "kosmo build")}`,
  `  Build all source folders`,
  "",
  `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "@admin")}`,
  `  Build single source folder`,
  "",
  `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "@admin @front")}`,
  `  Build multiple source folders`,
  "",

  styleText("bold", "COMMON OPTIONS"),
  "",
  `  ${styleText("magenta", "-q, --quiet")}`,
  `  Suppress all output in non-interactive mode (errors still shown)`,
  "",
  `  ${styleText("magenta", "-h, --help")}`,
  `  Display this help message and exit`,
  "",
];

const printUsage = () => {
  for (const line of usage) {
    console.log(line);
  }
};

const options = parseArgs({
  options: {
    name: { type: "string" },
    framework: { type: "string" },
    ssr: { type: "boolean" },
    base: { type: "string" },
    port: { type: "string" },
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

const cwd = process.cwd();

const prefixColors = ["cyan", "magenta", "yellow", "green", "blue", "auto"];

const packageFile = resolve(cwd, "package.json");
const packageFileExists = await pathExists(packageFile);

const packageJson = packageFileExists
  ? await import(packageFile, { with: { type: "json" } }).then((e) => e.default)
  : undefined;

const handlers: Record<
  "folder" | "dev" | "build",
  (f: Array<string>) => Promise<void>
> = {
  async folder() {
    const messages = messageFactory(
      options.values.quiet ? () => {} : console.log,
    );

    if ("name" in options.values) {
      // non-interactive mode

      assertNoError(() => validateName(options.values.name));

      assertNoError(() => validateBase(options.values.base));

      assertNoError(() => validatePort(options.values.port));

      assertNoError(() => {
        return FRAMEWORK_OPTIONS.includes(options.values.framework as never)
          ? undefined
          : `Invalid framework, use one of: ${FRAMEWORK_OPTIONS.join(", ")}`;
      });

      const folder = options.values as SourceFolder;

      await createSourceFolder(cwd, folder);

      messages.sourceFolderCreated(folder);

      return;
    }

    // interactive mode

    const onState: PromptObject["onState"] = (state) => {
      if (state.aborted) {
        process.nextTick(() => process.exit(1));
      }
    };

    console.log(
      styleText(
        ["bold", "green"],
        "➜ Great! Let's create a new Source Folder:\n",
      ),
    );

    const folder = await prompts<
      "name" | "base" | "port" | "framework" | "ssr"
    >([
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
        type: "number",
        name: "port",
        message: "Dev Server Port",
        initial: DEFAULT_PORT,
        onState,
        validate: (port) => validatePort(port || DEFAULT_PORT) || true,
      },

      {
        type: "select",
        name: "framework",
        message: "Frontend Framework",
        onState,
        choices: FRAMEWORK_OPTIONS.map((name) => {
          return { title: name, value: name };
        }),
      },

      {
        type: (prev: (typeof FRAMEWORK_OPTIONS)[number]) => {
          return prev === "none" // skip if no framework
            ? undefined
            : "toggle";
        },
        name: "ssr",
        message: "Enable server-side rendering (SSR)?",
        initial: false,
        active: "yes",
        inactive: "no",
      },
    ]);

    await createSourceFolder(cwd, folder);

    messages.sourceFolderCreated(folder);
  },

  async dev(folders) {
    const { result, commands } = concurrently(
      folders.map((name) => {
        return { name, command: "vite dev", cwd: name };
      }),
      {
        prefixColors,
        handleInput: true,
        raw: true,
      },
    );

    let manualShutdown = false;

    process.stdin.on("end", async () => {
      manualShutdown = true;
      console.log("\nEOF detected - stopping all processes...");
      for (const cmd of commands) {
        cmd.kill();
      }
      // Give processes time to cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    return result.then(
      () => process.exit(0),
      () => process.exit(manualShutdown ? 0 : 1),
    );
  },

  async build(folders) {
    const { result } = concurrently(
      folders.map((name) => {
        return { name, command: "vite build", cwd: name };
      }),
      { prefixColors, raw: true },
    );
    await result;
  },
};

const [command, ...optedFolders] = options.positionals as [
  command: keyof typeof handlers,
  ...optedFolders: Array<string>,
];

try {
  assertNoError(() => {
    return packageJson?.distDir
      ? undefined
      : "No KosmoJS project found in current directory";
  });

  assertNoError(() => {
    return handlers[command]
      ? undefined
      : `Invalid command, use one of ${Object.keys(handlers).join(", ")}`;
  });

  if (command === "folder") {
    await handlers[command]([]);
  } else {
    const configs = await glob(
      optedFolders.length
        ? optedFolders.map((e) => `${e}/vite.config.*`)
        : "**/vite.config.*",
      {
        absolute: false,
        deep: 2,
      },
    );

    const sourceFolders = configs.map(dirname);

    assertNoError(() => {
      if (optedFolders.length) {
        return optedFolders.length === sourceFolders.length
          ? undefined
          : "Some of given names does not contain a valid KosmoJS source folder";
      }

      return sourceFolders.length //
        ? undefined
        : "No source folders detected";
    });

    await handlers[command](sourceFolders);
  }
} catch (
  // biome-ignore lint: any
  error: any
) {
  console.error(error.message);
  process.exit(1);
}
