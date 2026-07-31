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
  slot?: "api" | "fetch" | "ssr" | "ssg";

  /**
   * Package dependencies required by this generator.
   * The dev plugin checks installation status before running.
   * */
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;

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

type GeneratorOptionsTuple = [Record<string, unknown> | object, boolean];

type OptionsShape<T> = T extends [infer S, ...unknown[]] ? S : void;

type OptionsRequired<T> = T extends [unknown, infer R extends boolean]
  ? R
  : false;

export type GeneratorFactoryInstance = {
  meta: GeneratorMeta;
  options?: GeneratorOptionsTuple[0] | undefined;
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
};

export type GeneratorFactory<T extends GeneratorOptionsTuple | void = void> =
  T extends void
    ? (m: GeneratorMeta, f: SourceFolder) => GeneratorFactoryInstance
    : OptionsRequired<T> extends true
      ? (
          m: GeneratorMeta,
          f: SourceFolder,
          o: OptionsShape<T>,
        ) => GeneratorFactoryInstance
      : (
          m: GeneratorMeta,
          f: SourceFolder,
          o?: OptionsShape<T>,
        ) => GeneratorFactoryInstance;

export type GeneratorBase = {
  meta: GeneratorMeta;
  options?: GeneratorOptionsTuple[0] | undefined;
  factory: (sourceFolder: SourceFolder) => GeneratorFactoryInstance;
};

export type DefineGenerator = <T extends GeneratorOptionsTuple | void = void>(
  setup: (options: T extends void ? void : OptionsShape<T>) => GeneratorBase,
) => T extends void
  ? () => GeneratorBase
  : OptionsRequired<T> extends true
    ? (options: OptionsShape<T>) => GeneratorBase
    : (options?: OptionsShape<T>) => GeneratorBase;

export type DefineGeneratorFactory = <
  T extends GeneratorOptionsTuple | void = void,
>(
  f: GeneratorFactory<T>,
) => GeneratorFactory<T>;

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
