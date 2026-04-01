import type { ResolvedType } from "tfusion";
import type { UserConfig } from "vite";

import type { HostOpt } from "@kosmojs/core/fetch";

import type { GeneratorBase } from "./generators";
import type { ValidationDefinition } from "./validation";

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
  /** Generators to run for this source folder (validation, fetch clients, OpenAPI, etc.) */
  generators?: Array<GeneratorBase>;

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
  config: FolderConfig;
  /** Absolute path to the project root */
  root: string;
  /** Base URL this source folder is served from, e.g. "/" or "/admin" */
  baseurl: string;
  /** Base URL for API routes, e.g. "/api" */
  apiurl: string;
  /** output directory name, configured as `distDir` in package.json */
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

export type PageRouteMapperEntry = Pick<
  PageRoute,
  "name" | "pathPattern" | "params"
> & {
  layouts: Array<string>;
};

export type PageRouteMapper = <ParamsT extends Array<unknown>>(
  route: PageRouteMapperEntry,
) => {
  match(url: URL): string | undefined;
  parametrize(params: ParamsT): string;
  base(params: ParamsT, query?: Record<string, unknown>): string;
  path(params: ParamsT, query?: Record<string, unknown>): string;
  href(host: HostOpt, params: ParamsT, query?: Record<string, unknown>): string;
  layouts(): Array<string>;
};

export type ResolvedEntry =
  | { kind: "apiRoute"; entry: ApiRoute }
  | { kind: "apiUse"; entry: ApiUse }
  | { kind: "pageRoute"; entry: PageRoute }
  | { kind: "pageLayout"; entry: PageLayout };

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

type RouterFactoryOptions = {
  route: unknown;
  router: unknown;
  app: unknown;
};

type RouterFactorySignature<T extends RouterFactoryOptions> = {
  clientRouter: (url?: URL) => Promise<{ router: T["router"]; app: T["app"] }>;
  serverRouter: (url: URL) => Promise<{ router: T["router"]; app: T["app"] }>;
};

export type RouterFactory<T extends RouterFactoryOptions> = (
  factory: (routes: Array<T["route"]>) => RouterFactorySignature<T>,
) => (routes: Array<T["route"]>) => RouterFactorySignature<T>;

type RenderFactorySignature = {
  clientRender: () => Promise<void>;
  serverRender: () => Promise<void>;
  notFound: () => Promise<void>;
};

export type RenderFactory = (
  factory: () => RenderFactorySignature,
) => Promise<void>;

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
