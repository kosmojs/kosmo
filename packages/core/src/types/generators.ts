import type { UserConfig } from "vite";

import type { HostOpt } from "../fetch";
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
  slot?: "backend" | "fetch" | "ssr" | "ssg";

  /**
   * Enables type resolution for generators that require fully resolved type information.
   *
   * When `true`, types are resolved to their flattened representations before
   * generator execution, making complete type data available.
   * */
  resolveTypes?: boolean;

  /**
   * jsx option per folder; needed on react/solid folders,
   * should be missing on mdx folders.
   * */
  jsx?: "preserve";

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
   * Runs only on the SSR build, to update files that differ between CSR and SSR.
   * The pattern: have all consumers import the env-sensitive value from a single file,
   * ship a CSR default, and rewrite that one file here for SSR.
   * e.g. the fetch generator points every fetch client at a shared transport
   * module that exports `transport = fetch` by default; ssrBuild rewrites it to
   * export the SSR transport instead.
   * */
  ssrBuild?: () => Promise<void>;
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

export type PathMapperSignature<ParamsT extends readonly unknown[]> = {
  paramsMapper(params: ParamsT): Record<string, unknown>;
  parametrize(params: ParamsT): string;
  // route path without base
  // eg: if base is /admin and route path is /users
  // return just /users
  base(params: ParamsT, query?: Record<string, unknown>): string;
  // route path with base prepended, eg: /admin/users
  path(params: ParamsT, query?: Record<string, unknown>): string;
  href(host: HostOpt, params: ParamsT, query?: Record<string, unknown>): string;
};
