import type { UserConfig } from "vite";

import type { GeneratorSignature } from "./generators";

export type FolderConfig = Omit<
  UserConfig,
  "root" | "base" | "cacheDir" | "mode" | "builder" | "future" | "legacy"
> & {
  /** Base URL this source folder is served from, e.g. "/" or "/admin" */
  base:
    | string
    | {
        [key: string]: string;
        development?: string;
        test?: string;
        stage?: string;
        production?: string;
      };

  /** Base URL for API routes, e.g. "/api" */
  apiBase?: string;

  /** Generators to run for this source folder (validation, fetch clients, OpenAPI, etc.) */
  generators?: Array<GeneratorSignature>;

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
  config: Omit<FolderConfig, "base" | "apiBase"> & {
    base: string;
    apiBase: string;
  };
  /** Absolute path to the project root */
  root: string;
  /** output directory name, configured as `distDir` in package.json */
  distDir: string;
};

export type ProjectSettings = {
  root: string;
  sourceFolders: Array<SourceFolder>;
  command: "serve" | "build" | "typecheck";
  devPort: number;
};
