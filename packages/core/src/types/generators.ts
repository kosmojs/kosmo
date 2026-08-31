import type { UserConfig } from "vite";

import type { ProjectSettings, SourceFolder } from "./project";
import type { ResolvedEntry } from "./routes";

export type WatcherEvent = {
  kind: "create" | "update" | "delete";
  file: string;
};

export type GeneratorMeta = {
  name: string;

  /*
   * Used on core built-in generators to distinguish them from user-defined ones.
   * api/fetch generators always run first, ssr always run last.
   * User generators run in the order they were added.
   * */
  slot?: "backend" | "frontend" | "fetch" | "ssr" | "ssg";

  /**
   * Enables type resolution for generators that require fully resolved type information.
   *
   * When `true`, types are resolved to their flattened representations before
   * generator execution, making complete type data available.
   * */
  resolveTypes?: boolean;

  /**
   * jsx option per folder.
   * react and solid plugins compiles JSX, preserve works.
   * mdx does not compile JSX, react-jsx needed.
   * */
  jsx?: "preserve" | "react-jsx";

  /**
   * JSX transform target for this generator's source folder.
   * Sets the `jsxImportSource` in the source folder's tsconfig,
   * ensuring correct JSX type resolution per framework.
   * e.g. "react", "solid-js", "preact"
   * */
  jsxImportSource?: string;

  /**
   * Additional TypeScript type packages to include in the source folder's
   * tsconfig `types` array. Merged with the base types (vite/client, @types/node)
   * to ensure framework-specific ambient types are available.
   * e.g. ["@types/koa", "@types/formidable"]
   * */
  types?: Array<string>;
};

export type GeneratorCustomTemplates<T> = Record<
  string,
  string | ((r: T) => string)
>;

export type GeneratorFactory = {
  // Vite config provided by generator itself
  config?: (o: {
    kind: "client" | "backend";
    command: ProjectSettings["command"];
  }) => UserConfig;

  start?: () => Promise<void>;

  watch?: (
    entries: Array<ResolvedEntry>,
    event?: WatcherEvent,
  ) => Promise<void>;

  // runs before Vite build
  build?: (entries: Array<ResolvedEntry>) => Promise<void>;

  // runs after Vite build
  postBuild?: (entries: Array<ResolvedEntry>) => Promise<void>;

  /**
   * Modules whose content should not touch the fs.
   * Content potentially differs between the CSR and SSR graphs.
   *
   * Declared once and resolved per build by the `kosmo:virtualModules` Vite plugin,
   * so the choice is made at resolution time and nothing written on disk.
   * That is what lets a dev server and a production build share a project directory:
   * neither can flip a file under the other.
   * */
  virtualModules?: () => Array<VirtualModule>;
};

export type VirtualModule = {
  // Bare specifier the plugin owns, e.g. "virtual:kosmo/fetch-transport"
  specifier: string;
  // Source served on every graph except the SSR bundle
  csr: string;
  // Source served on the SSR bundle
  ssr: string;
};

/**
 * Dependency declarations are consumed twice:
 *  - when the source folder is created, before generators are configured
 *  - when the dev server or build starts, with generators configured
 * So when a function is provided, it is called twice: first with no options,
 * then with the resolved options. This lets a generator vary its dependencies
 * by option - e.g. enabling the tanstack.query option adds a dependency, and on
 * the next build the core generator re-invokes dependencies/devDependencies with
 * the target generator's options and warns if the newly required dependency is missing.
 * */
type GeneratorDependencies =
  | Record<string, string>
  | ((o?: object) => Record<string, string>);

export type GeneratorSignature = {
  meta: GeneratorMeta;
  factory: (sourceFolder: SourceFolder) => GeneratorFactory;
  options?: object;
  dependencies?: GeneratorDependencies;
  devDependencies?: GeneratorDependencies;
};
