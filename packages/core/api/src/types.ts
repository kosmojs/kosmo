/// <reference types="@types/bun" />

import type { ValidationErrorEntry } from "./errors/types";

export enum HTTPMethods {
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  GET = "GET",
  PUT = "PUT",
  PATCH = "PATCH",
  POST = "POST",
  DELETE = "DELETE",
}

export type HTTPMethod = keyof typeof HTTPMethods;

export type MiddlewareDefinition<MiddlewareT> = {
  kind: "middleware";
  middleware: Array<MiddlewareT>;
  options?: UseOptions | undefined;
};

export type HandlerDefinition<MiddlewareT> = {
  kind: "handler";
  middleware: Array<MiddlewareT>;
  method: HTTPMethod;
};

export type RouteDefinitionItem<MiddlewareT> =
  | MiddlewareDefinition<MiddlewareT>
  | HandlerDefinition<MiddlewareT>;

export interface UseSlots {
  errorHandler: string;
  extendContext: string;
  bodyparser: string;
  "validate:params": string;
  "validate:query": string;
  "validate:headers": string;
  "validate:cookies": string;
  "validate:json": string;
  "validate:form": string;
  "validate:multipart": string;
  "validate:raw": string;
  "validate:response": string;
}

export type UseOptions = {
  on?: Array<HTTPMethod>;
  slot?: keyof UseSlots;
  debug?: string | undefined;
};

export type RouterRouteSource<MiddlewareT> = {
  name: string;
  path: string;
  file: string;
  // useWrappers is same as defining middleware inside route definition,
  // just automatically imported from use.ts files
  useWrappers: [...a: Array<MiddlewareDefinition<MiddlewareT>>];
  definitionItems: Array<RouteDefinitionItem<MiddlewareT>>;
  params: Array<[name: string, isSplat?: boolean]>;
  numericParams: Array<string>;
  validationSchemas: ValidationSchemas;
  meta?: Record<string, unknown>;
};

export type RouterRoute<MiddlewareT> = {
  name: string;
  path: string;
  file: string;
  methods: Array<string>;
  middleware: Array<MiddlewareT>;
  debug: {
    headline: string;
    methods: string;
    middleware: string;
    handler: string;
    full: string;
  };
};

export type DevSetup = {
  /**
   * API request handler for development mode.
   *
   * In dev mode, incoming requests are routed based on URL:
   * - Requests matching apiurl routed to this handler (your API)
   * - All other requests routed to Vite dev server (pages/assets)
   *
   * Returns a function that processes API requests.
   * */
  requestHandler: () => (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) => Promise<void>;

  /**
   * Custom function to determine if a request should be handled by the API.
   *
   * By default, requests are routed to the API handler if their URL starts with `apiurl`.
   * Use this to implement custom heuristics for detecting API requests.
   * */
  requestMatcher?: (req: import("node:http").IncomingMessage) => boolean;

  /**
   * In dev mode, perform cleanup operations before reloading the API handler.
   * */
  teardownHandler?: () => void | Promise<void>;
};

type NodeServer = import("node:http").Server;

type NodeListen = {
  (
    port?: number,
    hostname?: string,
    backlog?: number,
    callback?: () => void,
  ): NodeServer;
  (port: number, hostname?: string, callback?: () => void): NodeServer;
  (port: number, backlog?: number, callback?: () => void): NodeServer;
  (port: number, callback?: () => void): NodeServer;
  (path: string, backlog?: number, callback?: () => void): NodeServer;
  (path: string, callback?: () => void): NodeServer;
  (options: import("net").ListenOptions, callback?: () => void): NodeServer;
  (handle: unknown, backlog?: number, callback?: () => void): NodeServer;
  (handle: unknown, callback?: () => void): NodeServer;
};

export type AppFactory<
  App extends {
    // All apps must support Node.js via .listen() interface.
    // Express/Koa have this natively.
    // Hono requires @hono/node-server adapter to provide .listen().
    listen: NodeListen;

    // Optional: native fetch handler for edge runtimes (Bun/Deno/Cloudflare).
    // Hono provides this natively; Express/Koa do not.
    fetch?: (request: Request) => Response | Promise<Response>;
  },
  AppOptions = unknown,
> = (factory: (a: { createApp: (o?: AppOptions) => App }) => App) => App;

export type RouterFactory<Router, RouterOptions = unknown> = (
  factory: (a: { createRouter: (o?: RouterOptions) => Router }) => Router,
) => Router;

export type CreateRouteMiddleware<MiddlewareT> = (data: {
  route: string;
  validationSchemas: ValidationSchemas;
  params: RouterRouteSource<MiddlewareT>["params"];
  numericParams: RouterRouteSource<MiddlewareT>["numericParams"];
}) => Array<MiddlewareDefinition<MiddlewareT>>;

export type CreateServer<App, Server> = (
  app: App,
  opt?: {
    port?: number;
    sock?: string;
    callback?: () => void | Promise<void>;
  },
) => Promise<Server>;

export type ServerFactory<App, Server> = (
  factory: (a: { createServer: CreateServer<App, Server> }) => void,
) => void;

/**
 * Request metadata validation targets.
 * */
export const RequestMetadataTargets = {
  query: "URL query parameters",
  headers: "HTTP request headers",
  cookies: "HTTP cookies",
} as const;

/**
 * Request body validation targets.
 *
 * Body formats are mutually exclusive - only one should be specified per handler.
 *
 * **Development behavior:**
 * - If multiple formats are defined, the builder displays a warning and
 *   disables validation schemas for the affected handler.
 * - If an unsuitable target is defined (e.g., `json`, `form`, `multipart`
 *   for a method without a body like GET, HEAD), a warning is displayed and
 *   validation schemas are disabled for that handler.
 *
 * This ensures misconfigurations are detected during development
 * for runtime to execute without false positive validation failures.
 *
 * Always define exactly one target that is suitable for current handler.
 * */
export const RequestBodyTargets = {
  json: "JSON request body",
  form: "URL-encoded form data",
  multipart: "Multipart form data",
  raw: "Raw body format (string/Buffer/ArrayBuffer/Blob)",
} as const;

export const RequestValidationTargets = {
  ...RequestMetadataTargets,
  ...RequestBodyTargets,
} as const;

export type RequestMetadataTarget = keyof typeof RequestMetadataTargets;
export type RequestBodyTarget = keyof typeof RequestBodyTargets;
export type RequestValidationTarget = keyof typeof RequestValidationTargets;

export type ValidationTarget = RequestValidationTarget | "params" | "response";

export type ValidationDefmap = Partial<{
  /**
   * Request metadata targets.
   * */
  query: Record<string, unknown>;
  headers: Record<string, string>;
  cookies: Record<string, unknown>;

  /**
   * Request body targets. One target per handler.
   *
   * POST<
   *   json: { id: number }
   *   // or form/multipart/raw
   * >((ctx) => {})
   * */
  json: unknown;
  form: Record<string, unknown>;
  multipart: Record<string, unknown>;
  raw: string | Buffer | ArrayBuffer | Blob;

  /**
   * Response variants.
   * Multiple variants can be specified via unions.
   *
   * POST<
   *   response:
   *     | [200, "json", User]
   *     | [201, "json"]
   *     | [301]
   * >((ctx) => {})
   * */
  response: [
    /**
     * HTTP status code to send with the response.
     * Common values: 200 (OK), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
     * */
    status: number,
    /**
     * Content-Type header for the response. Supports shorthand notation that gets
     * resolved via mime-types lookup (e.g., "json" becomes "application/json",
     * "html" becomes "text/html", "png" becomes "image/png")
     * */
    contentType?: string | undefined,
    /** The response body schema */
    body?: unknown,
  ];
}>;

export type ValidationCustomErrors = {
  error?: string;
} & {
  [E in `error.${string}`]?: string;
};

export type ValidationOptions = {
  runtimeValidation?: boolean | undefined;
} & ValidationCustomErrors;

export type ValidationOptmap = {
  [K in ValidationTarget]?: ValidationOptions;
};

export const StateKey: unique symbol = Symbol("kosmo.state");

export type ExtendContext<
  ParamsT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap,
  BodyparserOptions extends Record<RequestBodyTarget, unknown>,
> = {
  [StateKey]: Map<ValidationTarget, unknown>;
  bodyparser: {
    [T in RequestBodyTarget]: <R = Record<string, unknown>>(
      opts?: BodyparserOptions[T],
    ) => Promise<R>;
  };
  validated: {
    // Only iterate over defined keys
    [K in keyof VDefs as K extends RequestValidationTarget
      ? VOpts[K] extends { runtimeValidation: false }
        ? never
        : K
      : never]: VDefs[K];
  } & { params: ParamsT };
};

type ExtractBodies<R> = R extends [number, string, infer Body] ? Body : never;

export type ValidatedResponseBodies<VDefs extends ValidationDefmap> = [
  ExtractBodies<VDefs["response"]>,
] extends [never]
  ? unknown // No bodies extracted at all - fallback to unknown
  : ExtractBodies<VDefs["response"]>;

export type ValidationSchema = {
  check: (data: unknown) => boolean;
  errors: (data: unknown) => Array<ValidationErrorEntry>;
  errorMessage: (data: unknown) => string;
  errorSummary: (data: unknown) => string;
  validate: (data: unknown) => void;
};

export type ValidationSchemas<Extend = object> = {
  [T in RequestValidationTarget]?: Record<
    // http method
    string,
    {
      schema: ValidationSchema & Extend;
      runtimeValidation?: boolean;
      customErrors?: ValidationCustomErrors;
    }
  >;
} & {
  params?: ValidationSchema & Extend;
  response?: Record<
    // http method
    string,
    Array<{
      status: number;
      contentType?: string;
      schema?: ValidationSchema & Extend;
      runtimeValidation?: boolean;
      customErrors?: ValidationCustomErrors;
    }>
  >;
};
