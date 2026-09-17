import type { GeneratorSignature } from "./generators";
import type { ViteConfig } from "./generic";
import type {
  BackendOptions,
  FrontendOptions,
  TypeboxOptions,
} from "./integrations";

export type FolderConfig = {
  frontend?: FrontendOptions;
  backend?: BackendOptions;
  sidecar?: {
    entry: string;
    run?: string;
    serve?: boolean | undefined;
    viteConfig?: ViteConfig;
  };
  fetch?: boolean | { generator?: GeneratorSignature };
  validation?:
    | boolean
    | TypeboxOptions
    | { generator?: GeneratorSignature<TypeboxOptions> };
  typecheck?: boolean;
};

export type SourceFolder = {
  // Source folder name, e.g. "front", "admin", "app"
  name: string;
  // Resolved folder configuration
  config: FolderConfig;
  // Resolved folder generators
  generators: Array<GeneratorSignature>;
  // Absolute path to the project root
  root: string;
  // output directory name, configured as `distDir` in package.json
  distDir: string;
};

/**
 * What `dist/run.js` needs to know about a built folder.
 * Written next to the folder's build output so the runner discovers folders from disk
 * rather than from a table that a partial build could leave stale.
 * */
export type SourceFolderManifest = {
  name: string;
  frontend?: {
    base: string;
    ssr: boolean;
  };
  backend?: {
    base: string;
    aliasPatterns: Array<string>;
  };
};

export type ProjectSettings = {
  root: string;
  sourceFolders: Array<SourceFolder>;
  command: "serve" | "build" | "preview";
  // output directory name, configured as `distDir` in package.json
  distDir: string;
  // port the dev server listens on, configured as `devPort` in package.json
  devPort: number;
  // port the preview server listens on, configured as `previewPort` in package.json
  previewPort: number;
};
