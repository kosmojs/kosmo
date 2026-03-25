import type { IncomingMessage, ServerResponse } from "node:http";

import type { ResolvedType } from "tfusion";
import type { UserConfig } from "vite";

import type { HTTPMethod, ValidationTarget } from "@kosmojs/api";

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
  generators?: Array<GeneratorFactory>;

  /**
   * Name to use for custom runtime validation refinements.
   * @default "VRefine"
   * */
  refineTypeName?: string;
};

export type SourceFolder = {
  name: string;
  config: FolderConfig;
  root: string;
  baseurl: string;
  apiurl: string;
  distDir: string;
};

export type ProjectSettings = {
  root: string;
  sourceFolders: Array<SourceFolder>;
  command: "serve" | "build";
  devPort: number;
};

export type PathTokenStaticPart = {
  type: "static";
  value: string;
};

export type PathTokenParamPart = {
  type: "param";
  kind: "required" | "optional" | "splat";
  name: string;
  /** codegen-safe identifier: sanitized name + crc suffix when needed */
  const: string;
};

export type PathToken = {
  kind:
    | "static" // segment is purely static
    | "param" // segment is a single pure param (no static parts)
    | "mixed"; // segment has both static and param parts

  // original segment string, eg. [id] or {name} or {...path}
  orig: string;

  // path-to-regexp pattern obtained from original segment,
  // eg. :id or {/:name} or {/*path}
  pattern: string;

  // parsed parts of the segment
  parts: Array<PathTokenStaticPart | PathTokenParamPart>;
};

/**
 * route entry as found in file-system, before any processing
 * */
export type RouteEntry = {
  // Unique ID across all routes, safe to use as a JavaScript identifier
  // in generated code (constants, imports, etc.).
  id: string;
  name: string;
  // root folder route defined in; either api or pages
  folder: string;
  // path to route file, relative to route folder
  file: string;
  fileFullpath: string;
  pathTokens: Array<PathToken>;
  // path-to-regexp pattern
  pathPattern: string;
};

export type NestedRouteEntry = {
  index: Omit<RouteEntry, "fileFullpath"> | undefined;
  layout: Omit<RouteEntry, "fileFullpath"> | undefined;
  parent: string | undefined;
  children: Array<NestedRouteEntry>;
};

export type ApiRoute = RouteEntry & {
  params: {
    id: string;
    schema: Array<PathTokenParamPart>;
    resolvedType: ResolvedType | undefined;
  };
  numericParams: Array<string>;
  optionalParams: boolean;
  methods: Array<string>;
  typeDeclarations: Array<TypeDeclaration>;
  validationDefinitions: Array<ValidationDefinition>;
  // absolute path to referenced files
  referencedFiles: Array<string>;
};

export type ApiUse = RouteEntry;

export type PageRoute = RouteEntry & {
  params: {
    schema: Array<PathTokenParamPart>;
  };
};

export type PageLayout = RouteEntry;

export type ResolvedEntry =
  | { kind: "apiRoute"; entry: ApiRoute }
  | { kind: "apiUse"; entry: ApiUse }
  | { kind: "pageRoute"; entry: PageRoute }
  | { kind: "pageLayout"; entry: PageLayout };

export type ValidationDefinition = {
  method: HTTPMethod;
  runtimeValidation?: boolean | undefined;
  customErrors?: Record<string, string> | undefined;
} & (
  | {
      target: "response";
      variants: Array<{
        id: string;
        status: number;
        contentType: string | undefined;
        body: string | undefined;
        resolvedType?: ResolvedType | undefined;
      }>;
    }
  | {
      target: Exclude<ValidationTarget, "response">;
      contentType?: string | undefined;
      schema: {
        id: string;
        text: string;
        resolvedType?: ResolvedType | undefined;
      };
    }
);

export type RequestValidationDefinition = Exclude<
  ValidationDefinition,
  { target: "response" }
>;

export type ResponseValidationDefinition = Extract<
  ValidationDefinition,
  { target: "response" }
>;

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

export type WatcherEvent = {
  kind: "create" | "update" | "delete";
  file: string;
};

export type WatchHandler = (
  entries: Array<ResolvedEntry>,
  event?: WatcherEvent,
) => Promise<void>;

type GeneratorFactoryReturn = {
  watch: WatchHandler;
  build: (entries: Array<ResolvedEntry>) => Promise<void>;
};

export type DefineGenerator = <
  O extends Record<string, unknown> | undefined = undefined,
  R extends boolean = false,
>(
  factory: [O] extends [undefined]
    ? () => GeneratorFactory
    : (o: O) => GeneratorFactory<O>,
  options?: GeneratorMeta,
) => [O] extends [undefined]
  ? () => GeneratorFactory
  : [R] extends [true]
    ? (o: O) => GeneratorFactory<O>
    : (o?: O) => GeneratorFactory<O>;

export type GeneratorFactory<
  O extends Record<string, unknown> | undefined = undefined,
  R extends boolean = false,
> = [O] extends [undefined]
  ? (f: SourceFolder) => Promise<GeneratorFactoryReturn>
  : [R] extends [true]
    ? (f: SourceFolder, o: O) => Promise<GeneratorFactoryReturn>
    : (f: SourceFolder, o?: O) => Promise<GeneratorFactoryReturn>;

export type GeneratorMeta = {
  name: string;

  /*
   * Used on core built-in generators to distinguish them from user-defined ones.
   * api/fetch generators always run first, ssr always run last.
   * User generators run in the order they were added.
   * */
  slot?: "api" | "fetch" | "ssr";

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
};

type RouterSetup<R> = {
  clientRouter: () => R | Promise<R>;
  serverRouter: (ssrOpts: { url: URL }) => R | Promise<R>;
};

export type RouterFactory<AppT, RouteT, RouterT> = (
  factory: (
    app: AppT,
    routes: Array<RouteT>,
  ) => RouterSetup<RouterT> | Promise<RouterSetup<RouterT>>,
) => (
  app: AppT,
  routes: Array<RouteT>,
  ssrOpts?: { url: URL },
) => RouterT | Promise<RouterT>;

type RenderSetup = {
  clientRender: () => void | Promise<void>;
  serverRender: () => void | Promise<void>;
};

export type RenderFactory = (
  factory: () => RenderSetup | Promise<RenderSetup>,
) => void | Promise<void>;

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
  //   - `text` → decoded CSS content for inline <style> usage
  //   - `path` → the browser-loadable asset path (for <link> usage)
  //
  // What the SSR renderer can do with `criticalCss`:
  //
  //   ✓ Inline style text (<style>…</style>) for fastest first paint
  //   ✓ Insert <link rel="stylesheet" href="..."> for cache reuse
  //   ✓ Insert <link rel="preload" as="style"> for warm loading
  criticalCss: Array<{ text: string; path: string }>;

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
  url: URL,
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
export type SSRStream = (url: URL, opt: SSROptions) => void | Promise<void>;

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup = {
  /**
   * The server calls render functions with current request URL and SSROptions.
   *
   * If both are provided, `renderToStream` takes precedence since streaming
   * enables earlier flushing and improved Time-to-First-Byte (TTFB).
   * `renderToString` will only be used if a streaming renderer is not available.
   * */
  renderToString?: SSRString;
  renderToStream?: SSRStream;

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

export type SSRFactory = (
  factory: () => SSRSetup | Promise<SSRSetup>,
) => SSRSetup | Promise<SSRSetup>;

export type RouteResolverCache = {
  hash: number;
  referencedFiles: Record<string, number>;
} & Pick<
  ApiRoute,
  | "params"
  | "methods"
  | "numericParams"
  | "typeDeclarations"
  | "validationDefinitions"
>;

export type RouteResolverCacheFactory = (
  route: Pick<ApiRoute, "id" | "file" | "fileFullpath">,
  sourceFolder: SourceFolder,
  extraContext?: object,
) => {
  get: (opt?: {
    validate?: boolean;
  }) => Promise<RouteResolverCache | undefined>;
  // set is taking referencedFiles as an array
  // and transforming into an object;
  // also is adding a hash.
  set: (
    cache: Omit<RouteResolverCache, "hash" | "referencedFiles"> & {
      referencedFiles: Array<string>;
    },
  ) => Promise<RouteResolverCache>;
};
