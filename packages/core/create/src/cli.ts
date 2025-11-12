#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import prompts, { type PromptObject } from "prompts";

import {
  assertNoError,
  CLI_OPTIONS,
  DEFAULT_BASE,
  DEFAULT_DIST,
  DEFAULT_FRAMEWORK,
  DEFAULT_PORT,
  FRAMEWORK_OPTIONS,
  messageFactory,
  type Project,
  pathExists,
  type SourceFolder,
  validateBaseurl,
  validateName,
  validateOptions,
  validatePath,
  validatePortNumber,
} from "./base";
import { createProject, createSourceFolder } from "./factory";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",
  "By default, runs in interactive mode, prompting for each step.",
  "To run non-interactively, provide the required arguments below.",
  "",
  styleText("bold", "BASIC USAGE"),
  "",
  `  ${styleText("blue", "npx kosmojs")}`,
  "  Create a new Project (interactive mode)",
  "  Or create a Source Folder when inside an existing project",
  "",
  `  ${styleText("magenta", "-q, --quiet")}`,
  "  Suppress all output in non-interactive mode (errors still shown)",
  "",
  `  ${styleText("magenta", "-h, --help")}`,
  "  Display this help message and exit",
  "",
  styleText("bold", "NON-INTERACTIVE MODE"),
  "",
  `  ${styleText("cyan", "-c, --create")} ${styleText("dim", "<type>")}`,
  "  Options: 'project' or 'folder'",
  "  Required for non-interactive mode",
  "",
  `  ${styleText("cyan", "-n, --name")} ${styleText("dim", "<name>")}`,
  "  Name of the project or source folder",
  "  Required for non-interactive mode",
  "",
  styleText("bold", "PROJECT OPTIONS"),
  "",
  `  ${styleText("cyan", "-d, --dist")} ${styleText("dim", "<directory>")}`,
  `  Distribution directory name (default: ${styleText("dim", DEFAULT_DIST)})`,
  "",
  styleText("bold", "SOURCE FOLDER OPTIONS"),
  "",
  `  ${styleText("cyan", "-f, --framework")} ${styleText("dim", "<framework>")}`,
  `  Frontend framework: ${FRAMEWORK_OPTIONS.map((e) => styleText("yellow", e)).join(", ")}`,
  `  Default: ${styleText("dim", DEFAULT_FRAMEWORK)}`,
  "",
  `  ${styleText("cyan", "-s, --ssr")}`,
  "  Enable SSR when framework is not 'none'",
  `  Default: ${styleText("dim", "disabled")}`,
  "",
  `  ${styleText("cyan", "-b, --baseurl")} ${styleText("dim", "<path>")}`,
  `  Base URL path (default: ${styleText("dim", DEFAULT_BASE)})`,
  "  Must start with '/' and contain only alphanumerics, hyphens or periods",
  "  Path traversal patterns not allowed",
  "",
  `  ${styleText("cyan", "-p, --port")} ${styleText("dim", "<number>")}`,
  `  Development server port (default: ${styleText("dim", `${DEFAULT_PORT}`)})`,
  "  Must be a positive integer",
  "",
];

const printUsage = () => {
  for (const line of usage) {
    console.log(line);
  }
};

const options = parseArgs({
  options: CLI_OPTIONS,
  strict: true,
});

if (options.values.help) {
  printUsage();
  process.exit(0);
}

const cwd = process.cwd();

const packageFile = resolve(cwd, "package.json");
const packageFileExists = await pathExists(packageFile);

const packageJson = packageFileExists
  ? await import(packageFile, { with: { type: "json" } }).then((e) => e.default)
  : undefined;

const { values } = options;
const messages = messageFactory(values.quiet ? () => {} : console.log);

try {
  if ("create" in options.values) {
    // non-interactive session
    const validateOption = validateOptions(options);

    assertNoError(() => validateOption("create"));

    assertNoError(() => validateOption("name"));

    if (options.values.create === "project") {
      if ("dist" in values) {
        assertNoError(() => validateOption("dist"));
      }

      const project: Project = {
        name: values.name as string,
        distDir: values.dist || DEFAULT_DIST,
      };

      await createProject(cwd, project);

      messages.projectCreated(project);
    } else {
      assertNoError(() => {
        return packageJson?.distDir
          ? undefined
          : "No KosmoJS project found in current directory";
      });

      if ("baseurl" in values) {
        assertNoError(() => validateOption("baseurl"));
      }

      if ("port" in values) {
        assertNoError(() => validateOption("port"));
      }

      if ("framework" in values) {
        assertNoError(() => validateOption("framework"));
      }

      if ("ssr" in values) {
        assertNoError(() => validateOption("ssr"));
      }

      const folder: SourceFolder = {
        name: values.name as string,
        framework: (values.framework as never) || DEFAULT_FRAMEWORK,
        ssr: values.ssr ? true : false,
        baseurl: values.baseurl || DEFAULT_BASE,
        port: Number(values.port ? values.port : DEFAULT_PORT),
      };

      await createSourceFolder(cwd, folder);

      messages.sourceFolderCreated(folder);
    }
  } else {
    // interactive session

    const onState: PromptObject["onState"] = (state) => {
      if (state.aborted) {
        process.nextTick(() => process.exit(1));
      }
    };

    const viteBaseExists = await pathExists(resolve(cwd, "vite.base.ts"));

    if (viteBaseExists && packageJson?.distDir) {
      console.log(
        styleText(
          ["bold", "green"],
          "➜ Great! Let's create a new Source Folder:",
        ),
      );

      const folder = await prompts<
        "name" | "framework" | "ssr" | "baseurl" | "port"
      >([
        {
          type: "text",
          name: "name",
          message: "Folder Name",
          onState,
          validate: (name) => validateName(name) || true,
        },

        {
          type: "select",
          name: "framework",
          message: "Frontend Framework",
          onState,
          choices: FRAMEWORK_OPTIONS.map((name) => {
            return { title: name, value: { name } };
          }),
        },

        {
          type: (prev) => {
            return prev.name === "none" // skip if no framework
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
          type: "text",
          name: "baseurl",
          message: "Base URL",
          initial: DEFAULT_BASE,
          onState,
          validate: (base) => {
            return base // validate only if given
              ? validateBaseurl(base) || true
              : true;
          },
        },

        {
          type: "number",
          name: "port",
          message: "Dev Server Port",
          initial: DEFAULT_PORT,
          onState,
          validate: (port) => {
            return port // validate only if given
              ? validatePortNumber(port) || true
              : true;
          },
        },
      ]);

      await createSourceFolder(cwd, folder);

      messages.sourceFolderCreated(folder);
    } else {
      console.log(
        styleText(
          ["bold", "green"],
          "🚀 Perfect! Let's bootstrap a new KosmoJS project:",
        ),
      );

      const project = await prompts<"name" | "distDir">([
        {
          type: "text",
          name: "name",
          message: "Project Name",
          onState,
          validate: (name) => validateName(name) || true,
        },

        {
          type: "text",
          name: "distDir",
          message: "Dist Folder",
          initial: DEFAULT_DIST,
          onState,
          validate: (path) => {
            return path // validate only if given
              ? validatePath(path) || true
              : true;
          },
        },
      ]);

      await createProject(cwd, project);

      messages.projectCreated(project);
    }
  }
} catch (
  // biome-ignore lint: any
  error: any
) {
  console.error(`${styleText("red", "✗ ERROR")}: ${error.message}`);
  process.exit(1);
}
