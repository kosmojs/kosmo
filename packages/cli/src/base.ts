import { styleText } from "node:util";

import { BACKENDS, FRONTENDS } from "@kosmojs/core";
import { containsPathTraversalPatterns } from "@kosmojs/lib";

export type PackageJSON = {
  devPort?: number;
  previewPort?: number;
  distDir?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type Project = {
  name: string;
  distDir?: string;
  devPort?: number;
  previewPort?: number;
};

export type SourceFolder = {
  name: string;
  frontend?: keyof typeof FRONTENDS | undefined;
  backend?: keyof typeof BACKENDS | undefined;
  ssr?: boolean | undefined;
  ssg?: boolean | undefined;
  tsq?: boolean | undefined;
};

export type MaybePromise<T> = T | Promise<T>;

export const CREATE_OPTIONS = ["project", "folder"] as const;

export const FOLDER_OPTIONS = {
  frontend: { type: "string" },
  "no-frontend": { type: "boolean" },
  backend: { type: "string" },
  "no-backend": { type: "boolean" },
  ssr: { type: "boolean" },
  ssg: { type: "boolean" },
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
    `  ${styleText("blue", "kosmo folder <name>")}`,
    `  Create <name> Source Folder in interactive mode, prompting for each step`,
    "",
    styleText(
      "bold",
      "  Use these options to create a Source Folder in CLI mode:",
    ),
    `  ${styleText("cyan", `--frontend`)} ${styleText("yellow", Object.keys(FRONTENDS).join("|"))} ${styleText("dim", "(--no-frontend for API-only folders)")}`,
    `  ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(--no-backend for client-only folders use)")}`,
    `  ${styleText("cyan", "--ssr")} ${styleText("dim", "enable server-side rendering (SSR)")}`,
    `  ${styleText("cyan", "--ssg")} ${styleText("dim", "enable static site generation (SSG); implies --ssr")}`,
    `  ${styleText("cyan", "--tsq")} ${styleText("dim", "enable TanStack Query")}`,
    `  ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,

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
