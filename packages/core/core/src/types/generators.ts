import type { StreamingApi } from "hono/utils/stream";
import type { Manifest, Plugin } from "vite";

import type { HostOpt } from "../fetch";
import type { ProjectSettings, SourceFolder } from "./project";
import type { PageRoute, ResolvedEntry } from "./routes";

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

type GeneratorOptionsTuple = [Record<string, unknown>, boolean];

type OptionsShape<T> = T extends [infer S, ...unknown[]] ? S : void;

type OptionsRequired<T> = T extends [unknown, infer R extends boolean]
  ? R
  : false;

export type GeneratorFactoryInstance = {
  meta: GeneratorMeta;
  options?: GeneratorOptionsTuple[0] | undefined;
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
  plugins?: (
    sourceFolder: SourceFolder,
    command: ProjectSettings["command"],
  ) => Array<Plugin>;
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

/**
 * SSR environment options passed to user-defined
 * renderToString / renderToStream functions.
 * */
export type SSROptions = {
  // The original client index.html output from Vite build.
  // Contains <!--app-head--> and <!--app-html--> placeholders
  // where SSR content should be injected.
  template: string;

  // Vite's final manifest.json - the full dependency graph for
  // client modules, dynamic imports, and related CSS.
  manifest: Manifest;

  // SSR-related assets, must be injected manually (unlike CSR assets that are injected by Vite).
  // Each entry provides three ways to consume the asset:
  //   - `tag`: ready-to-use HTML tag (<script> or <link>) for direct injection
  //   - `path`: asset URL for building custom tags with additional attributes
  //   - `content`: raw file contents for inlining as <style> or inline <script>
  // `size` is included for Content-Length or preload hints.
  assets: Array<{
    tag: string;
    kind: "js" | "css";
    path: string;
    content: string | undefined;
    size: number | undefined;
  }>;
};

/**
 * Return type for string-based SSR rendering.
 * - `head` is optional, user may choose to supply additional <meta>/<link>/<style> tags.
 * - `html` is the main server-rendered body markup for hydration.
 * */
export type SSRStringReturn = {
  head?: string;
  html: string;
};

/**
 * SSR string mode
 *
 * Returns head + html, synchronously or async.
 *
 * The server will:
 * - insert returned `head` into the HTML template
 * - place returned `html` into the body placeholder
 * */
export type SSRString = (url: URL, opt: SSROptions) => Promise<SSRStringReturn>;

/**
 * SSR stream mode
 *
 * Writes directly to the HTTP response.
 *
 * Responsibility of the user/render function:
 * - insert head at the correct time (before first flush)
 * - manage partial flushing, suspense boundaries, etc.
 *
 * The server will NOT modify the response body in this mode,
 * thus the renderer **must call `response.end()`** when streaming is finished,
 * otherwise the HTTP request will remain open and the client will hang.
 * */
export type SSRStream = (
  url: URL,
  opt: SSROptions,
  stream: StreamingApi,
) => Promise<void>;

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup = {
  /**
   * Renders the matched route to a complete HTML string.
   *
   * Required - used in both dev and production:
   * - Dev: always used (streaming is not supported in Vite middleware mode).
   * - Production: used when no `renderToStream` provided.
   * */
  renderToString: SSRString;

  /**
   * Renders the matched route as a progressive HTML stream.
   *
   * Optional - production only. When provided, takes precedence over
   * `renderToString` for improved Time-to-First-Byte (TTFB) by flushing
   * HTML chunks as they become available. Ignored in dev mode.
   * */
  renderToStream?: SSRStream;
};

export type SSRFactory = (factory: () => SSRSetup) => SSRSetup;

type CSRSetup = {
  mount: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export type CSRFactory = (factory: () => CSRSetup) => void;

type QueryT = Record<string, unknown>;

export type PageLinkBase = Pick<PageRoute, "name" | "pathPattern" | "params">;

export type PageLink<ParamsT> = PageLinkBase & {
  parametrize(params: ParamsT): string;
  base(params: ParamsT, query?: QueryT): string;
  path(params: ParamsT, query?: QueryT): string;
  href(host: HostOpt, params: ParamsT, query?: QueryT): string;
};
