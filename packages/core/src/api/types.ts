import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  ApiRouteSerialized,
  RequestBodyTarget,
  RequestMetadataTarget,
  RequestValidationTarget,
  ValidationDefmap,
  ValidationOptmap,
  ValidationSchemas,
} from "../types";

export enum HTTPMethods {
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
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

export interface DefaultUseSlots {
  edge: string;
  [slot: `edge:${string}`]: string;
  "validate:params": string;
  "validate:query": string;
  "validate:headers": string;
  "validate:cookies": string;
  "validate:json": string;
  "validate:form": string;
  "validate:raw": string;
  "validate:response": string;
}

export type UseOptions<S extends string = `${string}`> = {
  on?: Array<HTTPMethod>;
  slot?: S;
  debug?: string | undefined;
};

// what a route file and the use.ts files above it provide, once imported
export type RouteModules<MiddlewareT> = {
  // same as inline middleware inside route definition,
  // just automatically imported from use.ts files
  cascadingMiddleware: [...a: Array<MiddlewareDefinition<MiddlewareT>>];
  definitionItems: Array<RouteDefinitionItem<MiddlewareT>>;
  // no schemas provided when validation disabled
  validationSchemas?: ValidationSchemas;
};

export type RouteMeta = {
  name: string;
  path: string;
  // path-to-regexp pattern
  pathPattern: string;
  file: string;
  params: ApiRouteSerialized["params"];
  numericProperties: ApiRouteSerialized["numericProperties"];
  booleanProperties: ApiRouteSerialized["booleanProperties"];
  meta?: Record<string, unknown>;
};

/**
 * A route as the generator describes it: everything known without importing its file.
 * */
export type RouteSource<MiddlewareT> = RouteMeta & {
  /**
   * The methods of the array `defineRoute` returns, read from the file by the generator.
   * A route is registered for these, before its file is imported.
   * */
  methods: Array<HTTPMethod>;
  // imports the route file, its use.ts files and its validation schemas
  load: () => Promise<RouteModules<MiddlewareT>>;
};

// a route source with its modules imported
export type LoadedRouteSource<MiddlewareT> = RouteMeta &
  RouteModules<MiddlewareT>;

export type RouteDebugLevel =
  | "headline"
  | "methods"
  | "middleware"
  | "handler"
  | "full";

export type RouteDebugOption =
  | boolean
  | RouteDebugLevel
  | ((log: Record<RouteDebugLevel, string>, route: Route<never>) => void);

export type Route<MiddlewareT> = {
  name: string;
  path: string;
  file: string;
  method: HTTPMethod;
  middleware: Array<MiddlewareT>;
  debug: Record<RouteDebugLevel, string>;
};

/**
 * The API as the dev server runs it, built by the factory given to `devSetup`.
 * */
export type DevApp = {
  /**
   * Answers the requests routed to the API.
   *
   * In dev mode, incoming requests are routed based on URL:
   * - Requests matching apiurl routed to this handler (your API)
   * - All other requests routed to Vite dev server (pages/assets)
   * */
  requestHandler: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<unknown> | unknown;

  /**
   * Release whatever the factory opened: db connections, sockets, timers.
   *
   * Called once for every app that was built -
   * before each reload, and when the dev server stops.
   * The next program is evaluated only after the returned promise settles.
   * */
  teardownHandler?: () => void | Promise<void>;
};

/**
 * Hands the app to the dev server, with whatever it needs to run it.
 *
 * Called once per program, on the first API request after the program loaded.
 * Connections opened here are closed by the `teardownHandler` it returns.
 * */
export type DevAppFactory = () => DevApp | Promise<DevApp>;

export type DevSetupOptions = {
  /**
   * Determine if a request should be handled by the API.
   *
   * By default, requests are routed to the API handler if their URL starts with `backend.base`
   * or match any `backend.alias`.
   * Use this to implement custom heuristics for detecting API requests.
   *
   * Asked before the app is built, so it is an option rather than part of the app.
   * */
  requestMatcher?: (req: IncomingMessage) => boolean;
};

export type DevSetup = DevSetupOptions & {
  factory: DevAppFactory;
};

export type ExtendContext<
  ParamsT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap,
  BodyparserOptions extends
    | Record<RequestBodyTarget, unknown>
    | undefined = undefined,
> = {
  metaparser: {
    [T in RequestMetadataTarget]: <R = unknown>() => R;
  };
  bodyparser: {
    [T in RequestBodyTarget]: BodyparserOptions extends undefined
      ? <R = unknown>() => Promise<R>
      : <R = unknown>(opts?: NonNullable<BodyparserOptions>[T]) => Promise<R>;
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

export type ResponseResolver = (
  // biome-ignore lint: any
  ctx: any,
  // biome-ignore lint: any
  body: any,
) => {
  status: number;
  contentType: string | null;
  body: () => Promise<unknown>;
};
