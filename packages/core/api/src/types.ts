/// <reference types="@types/bun" />

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
  params: string;
  validateParams: string;
  bodyparser: string;
  payload: string;
  validatePayload: string;
  validateResponse: string;
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
  params: Array<[name: string, isRest?: boolean]>;
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

export type ValidationSchema = {
  check: (data: unknown) => boolean;
  errors: (data: unknown) => Array<ValidationErrorEntry>;
  errorMessage: (data: unknown) => string;
  errorSummary: (data: unknown) => string;
  validate: (data: unknown) => void;
};

export type ValidationSchemas<Extend = object> = {
  params?: ValidationSchema & Extend;
  payload?: Record<string, ValidationSchema & Extend>;
  response?: Record<string, ValidationSchema & Extend>;
};

export type ValidationErrorScope = "params" | "payload" | "response";

/**
 * Shape of individual validation errors emitted by generators.
 */
export type ValidationErrorEntry = {
  /** JSON Schema keyword that triggered the error (e.g. `format`, `maxItems`, `maxLength`). */
  keyword: string;
  /** JSON Pointer–style path to the invalid field (matches JSON Schema `instancePath`). */
  path: string;
  /** Human-readable error message. */
  message: string;
  /** Constraint parameters (e.g. `{ limit: 5 }`, `{ format: "email" }`). */
  params?: Record<string, unknown>;
  /** Optional error code for i18n/l10n or custom handling. */
  code?: string;
};

export type ValidationErrorData = {
  errors: Array<ValidationErrorEntry>;
  /**
   * Formats errors into a single human-readable message.
   * @example: Validation failed: user: missing required properties: "email", "name"; password: must be at least 8 characters long
   */
  errorMessage: string;
  /**
   * Gets a simple error summary for quick feedback.
   * @example: 2 validation errors found across 2 fields
   */
  errorSummary: string;
};
