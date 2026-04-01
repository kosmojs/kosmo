import type { Plugin } from "vite";

import type {
  ProjectSettings,
  ResolvedEntry,
  SourceFolder,
  WatcherEvent,
} from "./base";

export type GeneratorMeta = {
  name: string;

  /*
   * Used on core built-in generators to distinguish them from user-defined ones.
   * api/fetch generators always run first, ssr always run last.
   * User generators run in the order they were added.
   * */
  slot?: "api" | "fetch" | "mdx" | "ssr";

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

type GeneratorOptionsTuple = [Record<string, unknown>, boolean];

type OptionsShape<T> = T extends [infer S, ...unknown[]] ? S : void;

type OptionsRequired<T> = T extends [unknown, infer R extends boolean]
  ? R
  : false;

export type GeneratorFactoryInstance = {
  meta: GeneratorMeta;
  options: GeneratorOptionsTuple[0] | undefined;
  start: () => Promise<void>;
  watch: (entries: Array<ResolvedEntry>, event?: WatcherEvent) => Promise<void>;
  build: (entries: Array<ResolvedEntry>) => Promise<void>;
  plugins: (command: ProjectSettings["command"]) => Array<Plugin>;
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
  options: GeneratorOptionsTuple[0] | undefined;
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
