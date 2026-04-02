import type { UserConfig } from "vite";

import type { GeneratorBase } from "./generators";

export type FolderConfig = Pick<
  UserConfig,
  | "publicDir"
  | "plugins"
  | "html"
  | "css"
  | "json"
  | "oxc"
  | "assetsInclude"
  | "server"
  | "logLevel"
  | "customLogger"
  | "clearScreen"
  | "envDir"
  | "envPrefix"
  | "optimizeDeps"
  | "ssr"
  | "dev"
  | "build"
  | "define"
  | "resolve"
> & {
  /** Generators to run for this source folder (validation, fetch clients, OpenAPI, etc.) */
  generators?: Array<GeneratorBase>;

  /**
   * Name to use for custom runtime validation refinements.
   * @default "VRefine"
   * */
  refineTypeName?: string;
};

export type SourceFolder = {
  /** Source folder name, e.g. "front", "admin", "app" */
  name: string;
  /** Resolved folder configuration */
  config: FolderConfig;
  /** Absolute path to the project root */
  root: string;
  /** Base URL this source folder is served from, e.g. "/" or "/admin" */
  baseurl: string;
  /** Base URL for API routes, e.g. "/api" */
  apiurl: string;
  /** output directory name, configured as `distDir` in package.json */
  distDir: string;
};

export type ProjectSettings = {
  root: string;
  sourceFolders: Array<SourceFolder>;
  command: "serve" | "build";
  devPort: number;
};
