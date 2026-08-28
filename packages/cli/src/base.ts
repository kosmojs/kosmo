import { styleText } from "node:util";

import { BACKENDS, FRAMEWORKS } from "@kosmojs/core";

export type PackageJSON = {
  devPort?: number;
  distDir?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type Project = {
  name: string;
  distDir?: string;
  devPort?: number;
};

export type SourceFolder = {
  name: string;
  base: string;
  framework?: keyof typeof FRAMEWORKS | undefined;
  backend?: keyof typeof BACKENDS | undefined;
  ssr?: boolean | undefined;
  tsq?: boolean | undefined;
};

export type MaybePromise<T> = T | Promise<T>;

export const DEFAULT_NAME = "app";
export const DEFAULT_BASE = "/";

export const CREATE_OPTIONS = ["project", "folder"] as const;

export const FOLDER_OPTIONS = {
  name: { type: "string" },
  base: { type: "string" },
  framework: { type: "string" },
  "no-framework": { type: "boolean" },
  backend: { type: "string" },
  "no-backend": { type: "boolean" },
  ssr: { type: "boolean" },
  tsq: { type: "boolean" },
} as const;

type DependencyEntry = ["dependencies" | "devDependencies", string, string];

export const compareDependencies = (
  oldPackageJson: PackageJSON,
  newPackageJson: PackageJSON,
): Array<DependencyEntry> => {
  const newDependencies: Array<DependencyEntry> = [];

  for (const key of ["dependencies", "devDependencies"] as const) {
    for (const [pkg, ver] of Object.entries(newPackageJson[key] || {}) as Array<
      [string, string]
    >) {
      if (!oldPackageJson[key]?.[pkg]) {
        newDependencies.push([key, pkg, ver]);
      }
    }
  }

  return newDependencies;
};

export const isCLI = (unconditionalCLI?: unknown) => {
  return unconditionalCLI ? true : !process.stdout.isTTY;
};

export const validateName = (
  name: string | undefined,
  emptyNameError: string = "No name provided",
) => {
  if (!name?.trim()) {
    return emptyNameError;
  }
  if (/[^\w.@$+-]/.test(name)) {
    return "May contain only alphanumerics or any of . - + $ @";
  }
  if (containsPathTraversalPatterns(name)) {
    return "Should not contain path traversal patterns";
  }
  if (name.startsWith("-")) {
    return "Should not start with a dash";
  }
  return undefined;
};

export const validateBase = (base: string | undefined) => {
  if (!base?.trim()) {
    return "Invalid base";
  }
  if (base.includes(" ")) {
    return "Should not contain spaces";
  }
  if (containsPathTraversalPatterns(base)) {
    return "Should not contain path traversal patterns";
  }
  return undefined;
};

export const containsPathTraversalPatterns = (str: string): boolean => {
  return [
    // path traversal patterns
    /\.\.\//,
    /\/\.\//,
  ].some((e) => e.test(str));
};

export const assertNoError = (validator: () => string | undefined) => {
  const error = validator();
  if (error) {
    throw new Error(`✗ ${styleText(["red", "underline"], "ERROR")}: ${error}`);
  }
};

export const printUsage = () => {
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
      "  Use these options to create a Source Folder in CLI mode:",
    ),
    "",
    `  ${styleText("cyan", "--name")} ${styleText("dim", "<name>")}`,
    `  Source folder name ${styleText("dim", "(required)")}`,
    "",
    `  ${styleText("cyan", "--base")} ${styleText("dim", "<path>")}`,
    `  Base URL ${styleText("dim", "(required)")}`,
    "",
    `  ${styleText("cyan", "--framework")} ${styleText("dim", "<framework>")}`,
    `  Framework: ${styleText("yellow", Object.keys(FRAMEWORKS).join("|"))} ${styleText("dim", "(omit for API-only folders)")}`,
    "",
    `  ${styleText("cyan", "--backend")} ${styleText("dim", "<framework>")}`,
    `  Backend framework: ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(omit for client-only folders)")}`,
    "",
    `  ${styleText("cyan", "--overwrite")}`,
    `  Overwrite existing files ${styleText("dim", "(use with caution)")}`,
    "",
    `  ${styleText("cyan", "--ssr")}`,
    `  Enable server-side rendering (SSR)`,
    "",
    `  ${styleText("cyan", "--tsq")}`,
    `  Enable TanStack Query`,
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

    styleText("bold", "COMMON OPTIONS"),
    "",
    `  ${styleText("cyan", "-q, --quiet")}`,
    `  Suppress all output in CLI mode (errors still shown)`,
    "",
    `  ${styleText("cyan", "-h, --help")}`,
    `  Display this help message and exit`,
    "",
  ];

  for (const line of usage) {
    console.log(line);
  }
};
