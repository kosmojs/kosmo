import type { IncomingMessage, ServerResponse } from "node:http";

import type { ResolvedType } from "tfusion";
import type { ResolvedConfig } from "vite";

export type PluginOptions = {
  generators?: Array<GeneratorConstructor>;
  formatters?: Array<FormatterConstructor>;

  /**
   * Name to use for custom runtime validation refinements.
   * @default "TRefine"
   * */
  refineTypeName?: string;
};

export type PluginOptionsResolved = {
  baseurl: string;
  apiurl: string;
  appRoot: string;
  sourceFolder: string;
  outDir: string;
  command: ResolvedConfig["command"];
  generators: Array<GeneratorConstructor>;
  formatters: Array<Formatter>;
  refineTypeName: string;
  watcher: {
    // waits this many milliseconds before reacting after a change is detected
    delay: number;
    // copying watch options from vite config and passing down to workers
    options?: import("vite").WatchOptions;
  };
} & Omit<PluginOptions, "generators" | "formatters" | "refineTypeName">;

export type PathToken = {
  orig: string;
  base: string;
  path: string;
  ext: string;
  param?: {
    name: string;
    const: string;
    isRequired?: boolean;
    isOptional?: boolean;
    isRest?: boolean;
  };
};

/**
 * route entry as found in file-system, before any processing
 * */
export type RouteEntry = {
  name: string;
  // root folder route defined in; either api or pages
  folder: string;
  // path to route file, relative to route folder
  file: string;
  fileFullpath: string;
  pathTokens: Array<PathToken>;
  importName: string;
  importPath: string;
};

export type ApiRoute = RouteEntry & {
  params: {
    id: string;
    schema: Array<Required<PathToken>["param"]>;
    resolvedType: ResolvedType | undefined;
  };
  numericParams: Array<string>;
  optionalParams: boolean;
  methods: Array<string>;
  typeDeclarations: Array<TypeDeclaration>;
  payloadTypes: Array<PayloadType>;
  responseTypes: Array<ResponseType>;
  // absolute path to referenced files
  referencedFiles: Array<string>;
};

export type PageRoute = RouteEntry & {
  params: {
    schema: Array<Required<PathToken>["param"]>;
  };
};

export type PayloadType = {
  id: string;
  // needed to make connection between PayloadType and ResponseType
  responseTypeId?: string | undefined;
  method: string;
  skipValidation: boolean;
  isOptional: boolean;
  resolvedType: ResolvedType | undefined;
};

export type ResponseType = {
  id: string;
  method: string;
  skipValidation: boolean;
  resolvedType: ResolvedType | undefined;
};

export type TypeDeclaration = {
  text: string;

  importDeclaration?: {
    name: string;
    alias?: string | undefined;
    path: string;
  };

  exportDeclaration?: {
    name: string;
    alias?: string | undefined;
    path?: string | undefined;
  };

  typeAliasDeclaration?: {
    name: string;
  };

  interfaceDeclaration?: {
    name: string;
  };

  enumDeclaration?: { name: string };
};

export type PathParams = {
  text: string;
  properties: Array<{ name: string; type: string }>;
};

export type RouteResolverEntry =
  | { kind: "api"; route: ApiRoute }
  | { kind: "page"; route: PageRoute };

export type RouteResolver = {
  name: string;
  handler: (updatedFile?: string) => Promise<RouteResolverEntry>;
};

export type WatcherEvent = {
  kind: "create" | "update" | "delete";
  file: string;
};

export type WatchHandler = (
  entries: Array<RouteResolverEntry>,
  event?: WatcherEvent,
) => Promise<void>;

type GeneratorFactoryReturn = {
  watchHandler: WatchHandler;
};

export type GeneratorFactory<T = undefined> = T extends undefined
  ? (options: PluginOptionsResolved) => Promise<GeneratorFactoryReturn>
  : (
      options: PluginOptionsResolved,
      extra: T,
    ) => Promise<GeneratorFactoryReturn>;

export type GeneratorConstructor = {
  /*
   * Used on core built-in generators to distinguish them from user-defined ones.
   * api/fetch generators always run first, ssr always run last.
   * User generators run in the order they were added.
   * */
  kind?: "api" | "fetch" | "ssr";

  name: string;

  /**
   * Specifies the module import path and provided config for worker thread imports.
   *
   * In development mode, generators run inside a worker thread.
   * Since functions cannot be directly passed to worker threads,
   * this provides the module assets for the worker to dynamically import the generator.
   * */
  moduleImport: string;
  moduleConfig: unknown;

  factory: GeneratorFactory;

  options?: {
    /**
     * Enables type resolution for generators that require fully resolved type information.
     *
     * When `true`, types are resolved to their flattened representations before
     * generator execution, making complete type data available.
     * */
    resolveTypes?: boolean;
  };
};

export type Formatter = (text: string, filePath: string) => string;

export type FormatterConstructor<
  ModuleConfig extends object | undefined = undefined,
> = {
  moduleImport: string;
  moduleConfig: ModuleConfig;
  formatter: Formatter;
};

/**
 * Minimal shape of Vite's manifest.json entries.
 * */
export type SSRManifestEntry = {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  css?: string[];
  assets?: string[];
  imports?: string[];
  dynamicImports?: string[];
};

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
  manifest: Record<string, SSRManifestEntry>;

  // A list of CSS chunks relevant to the requested URL,
  // determined by resolving the manifest graph back to routes.
  //
  // Each entry includes:
  //   - `url`  → the browser-loadable asset path (for <link> usage)
  //   - `text` → decoded CSS content for inline <style> usage
  //
  // What the SSR renderer can do with `criticalCss`:
  //
  //   ✓ Inline style text (<style>…</style>) for fastest first paint
  //   ✓ Insert <link rel="stylesheet" href="..."> for cache reuse
  //   ✓ Insert <link rel="preload" as="style"> for warm loading
  criticalCss: Array<{ text: string; url: string }>;

  // The underlying Node.js HTTP request/response objects.
  //
  // These allow advanced SSR controllers to:
  //   - inspect headers (e.g., UA, cookies, locale)
  //   - set custom response headers (e.g., caching, redirects)
  //   - flush HTML progressively in streaming mode
  //
  // They are provided directly so renderers can choose either:
  //   → high-level HTML return (via renderToString), or
  //   → low-level streaming response control (via renderToStream).
  request: IncomingMessage;
  response: ServerResponse;
};

/**
 * Return type for string-based SSR rendering.
 *
 * - `head` is optional, user may choose to:
 *    - insert the provided critical CSS (opt.criticalCss),
 *    - override it (e.g. remove some styles),
 *    - or supply additional <meta>/<link>/<style> tags.
 *
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
export type SSRString = (
  opt: SSROptions,
) => SSRStringReturn | Promise<SSRStringReturn>;

/**
 * SSR stream mode
 *
 * Writes directly to the HTTP response.
 *
 * Responsibility of the user/render function:
 * - insert head + critical CSS at the correct time (before first flush)
 * - manage partial flushing, suspense boundaries, etc.
 *
 * The server will NOT modify the response body in this mode,
 * thus the renderer **must call `response.end()`** when streaming is finished,
 * otherwise the HTTP request will remain open and the client will hang.
 * */
export type SSRStream = (opt: SSROptions) => void | Promise<void>;

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup = {
  /**
   * The server calls this factory with current request URL.
   * The factory returns the appropriate SSR rendering functions based on given URL.
   *
   * - `renderToString`  → SSR full HTML prior to sending (small apps)
   * - `renderToStream`  → progressive HTML flushing (large apps / SEO)
   *
   * If both are provided, `renderToStream` takes precedence since streaming
   * enables earlier flushing and improved Time-to-First-Byte (TTFB).
   * `renderToString` will only be used if a streaming renderer is not available.
   * */
  factory: (url: URL) =>
    | {
        renderToString?: SSRString;
        renderToStream?: SSRStream;
      }
    | Promise<{
        renderToString?: SSRString;
        renderToStream?: SSRStream;
      }>;

  /**
   * Controls whether the SSR server should handle static asset requests (JS, CSS, images, fonts, etc.)
   *
   *   true  (default)
   *     → All built client assets are served directly from memory by SSR server.
   *     → Easiest setup - no external file server required.
   *
   *   false
   *     → A reverse proxy/CDN *must* serve all static files.
   *     → Otherwise any asset URL requested from browser (JS/CSS/img) will return `404`.
   *
   * Notes:
   *   - `criticalCss.text` can still be inlined regardless of this setting.
   *   - `criticalCss.url` remains provided for `<link>` usage,
   *     but loading that URL is the responsibility of the external static server.
   *
   * This option enables deployments where SSR and static delivery
   * are cleanly separated (e.g., Node behind nginx / cloud static hosting).
   * */
  serveStaticAssets?: boolean;
};
