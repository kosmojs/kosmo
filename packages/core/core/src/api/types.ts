import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  RequestBodyTarget,
  RequestValidationTarget,
  ValidationDefmap,
  ValidationOptmap,
  ValidationSchemas,
  ValidationTarget,
} from "../types/validation";

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
  "validate:raw": string;
  "validate:response": string;
}

export type UseOptions = {
  on?: Array<HTTPMethod>;
  slot?: keyof UseSlots;
  debug?: string | undefined;
};

export type RouteSource<MiddlewareT> = {
  name: string;
  path: string;
  // path-to-regexp pattern
  pathPattern: string;
  file: string;
  // same as inline middleware inside route definition,
  // just automatically imported from use.ts files
  cascadingMiddleware: [...a: Array<MiddlewareDefinition<MiddlewareT>>];
  definitionItems: Array<RouteDefinitionItem<MiddlewareT>>;
  params: Array<string>;
  numericParams: Array<string>;
  validationSchemas: ValidationSchemas;
  meta?: Record<string, unknown>;
};

export type Route<MiddlewareT> = {
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
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>;

  /**
   * Custom function to determine if a request should be handled by the API.
   *
   * By default, requests are routed to the API handler if their URL starts with `apiurl`.
   * Use this to implement custom heuristics for detecting API requests.
   * */
  requestMatcher?: (req: IncomingMessage) => boolean;

  /**
   * In dev mode, perform cleanup operations before reloading the API handler.
   * */
  teardownHandler?: () => void | Promise<void>;
};

export type AppFactory<App, AppOptions = unknown> = (
  factory: (a: { createApp: (o?: AppOptions) => App }) => App,
) => App;

export type RouterFactory<Router, RouterOptions = unknown> = (
  factory: (a: { createRouter: (o?: RouterOptions) => Router }) => Router,
) => Router;

export type CreateRouteMiddleware<MiddlewareT> = (
  routeSource: RouteSource<MiddlewareT>,
) => Array<MiddlewareDefinition<MiddlewareT>>;

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
export const StateKey: unique symbol = Symbol("kosmo.state");

export type ExtendContext<
  ParamsT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap,
  BodyparserOptions extends Record<RequestBodyTarget, unknown>,
> = {
  [StateKey]: Map<ValidationTarget, unknown>;
  bodyparser: {
    [T in RequestBodyTarget]: <R = unknown>(
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
