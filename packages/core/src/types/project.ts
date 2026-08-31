import type { UserConfig } from "vite";

import type { GeneratorSignature } from "./generators";

export type FolderConfig = Omit<
  UserConfig,
  "root" | "base" | "cacheDir" | "mode" | "builder" | "future" | "legacy"
> & {
  // Base URL this source folder is served from, e.g. "/" or "/admin"
  base:
    | string
    | {
        [key: string]: string;
        development?: string;
        test?: string;
        stage?: string;
        production?: string;
      };

  // Base URL for API routes, e.g. "/api"
  apiBase?: string;

  // Generators to run for this source folder (validation, fetch clients, OpenAPI, etc.)
  generators?: Array<GeneratorSignature>;

  // Name to use for custom runtime validation refinements.
  // @default "VRefine"
  refineTypeName?: string;
};

export type SourceFolder = {
  // Source folder name, e.g. "front", "admin", "app"
  name: string;
  // Resolved folder configuration
  config: Omit<FolderConfig, "base" | "apiBase" | "generators"> & {
    base: string;
    apiBase: string;
    generators: Array<GeneratorSignature>;
  };
  // Absolute path to the project root
  root: string;
  // output directory name, configured as `distDir` in package.json
  distDir: string;
};

export type ProjectSettings = {
  root: string;
  sourceFolders: Array<SourceFolder>;
  command: "serve" | "build" | "preview" | "typecheck";
  // output directory name, configured as `distDir` in package.json
  distDir: string;
  // port the dev server listens on, configured as `devPort` in package.json
  devPort: number;
  // port the preview server listens on, configured as `previewPort` in package.json
  previewPort: number;
};
