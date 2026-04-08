import { cp } from "node:fs/promises";
import { basename } from "node:path";
import { styleText } from "node:util";

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
  base?: string;
  framework?: keyof typeof FRAMEWORKS | "none";
  backend?: keyof typeof BACKEND_FRAMEWORKS | "none";
  ssr?: boolean;
  ssg?: boolean;
};

export enum FRAMEWORKS {
  react = "React",
  vue = "Vue",
  solid = "SolidJS",
}

export enum BACKEND_FRAMEWORKS {
  hono = "Hono",
  koa = "Koa",
}

export const CREATE_OPTIONS = ["project", "folder"] as const;
export const DEFAULT_DIST = "dist";
export const DEFAULT_BASE = "/";
export const DEFAULT_PORT = 4556;
export const DEFAULT_FRAMEWORK: SourceFolder["framework"] = "none";
export const DEFAULT_BACKEND: SourceFolder["backend"] = "none";

export const copyFiles = async (
  src: string,
  dst: string,
  { exclude = [] }: { exclude?: Array<string | RegExp> } = {},
): Promise<void> => {
  const filter = exclude.length
    ? (path: string) => {
        return !exclude.some((e) => {
          return typeof e === "string" ? e === basename(path) : e.test(path);
        });
      }
    : undefined;

  await cp(src, dst, {
    recursive: true,
    force: true,
    filter,
  });
};

export const compareDependencies = async (
  oldPackageJson: PackageJSON,
  newPackageJson: PackageJSON,
) => {
  const newDependencies: Array<
    ["dependencies" | "devDependencies", string, string]
  > = [];

  for (const key of ["dependencies", "devDependencies"] as const) {
    for (const [pkg, ver] of Object.entries(newPackageJson[key] || {}) as Array<
      [string, string]
    >) {
      if (!oldPackageJson[key]?.[pkg]) {
        newDependencies.push([key, pkg, ver]);
      }
    }
  }

  if (newDependencies.length) {
    console.warn();
    console.warn(
      [
        "💡 ",
        styleText(["bold", "italic", "red"], "New dependencies added: "),
        styleText("dim", newDependencies.map(([, pkg]) => pkg).join(", ")),
      ].join(""),
    );
    console.warn(
      "📦",
      [
        styleText(["bold", "blueBright"], "Install them before continue: "),
        styleText(
          "dim",
          ["npm", "pnpm", "yarn"].map((e) => `\`${e} install\``).join(" / "),
        ),
      ].join(""),
    );
    console.warn();
  }
};

export const validateName = (name: string | undefined) => {
  if (!name) {
    return "Invalid name provided";
  }
  if (/[^\w.@$+-]/.test(name)) {
    return "May contain only alphanumerics, hyphens, periods or any of @ $ +";
  }
  return undefined;
};

export const validateBase = (base: string | undefined) => {
  if (!base?.startsWith("/")) {
    return "Should start with a slash";
  }
  if (
    [
      // path traversal patterns
      /\.\.\//,
      /\/\.\//,
    ].some((e) => e.test(base.trim()))
  ) {
    return "Should not contain path traversal patterns";
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
    `  ${styleText("cyan", "--framework")} ${styleText("dim", "<framework>")}`,
    `  Framework: ${Object.keys(FRAMEWORKS)
      .map((e) => styleText("yellow", e))
      .join(", ")} ${styleText("dim", "(omit for API-only folders)")}`,
    "",
    `  ${styleText("cyan", "--backend")} ${styleText("dim", "<framework>")}`,
    `  Backend framework: ${Object.keys(BACKEND_FRAMEWORKS)
      .map((e) => styleText("yellow", e))
      .join(", ")} ${styleText("dim", "(omit for client-only folders)")}`,
    "",
    `  ${styleText("cyan", "--ssr")}`,
    `  Enable server-side rendering (SSR)`,
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

    styleText("bold", "COMMON OPTIONS"),
    "",
    `  ${styleText("magenta", "-q, --quiet")}`,
    `  Suppress all output in non-interactive mode (errors still shown)`,
    "",
    `  ${styleText("magenta", "-h, --help")}`,
    `  Display this help message and exit`,
    "",
  ];

  for (const line of usage) {
    console.log(line);
  }
};
