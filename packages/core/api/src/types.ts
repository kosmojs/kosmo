import type { RouterContext, RouterMiddleware } from "@koa/router";
import type { Next } from "koa";

declare module "koa" {
  interface Request {
    body?: unknown;
    rawBody: string;
  }
}

export interface DefaultState {}
export interface DefaultContext {}

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

export type ParameterizedContext<
  ParamsT,
  StateT,
  ContextT,
  PayloadT = unknown,
  ResponseT = unknown,
> = RouterContext<
  DefaultState & StateT,
  DefaultContext &
    ContextT & {
      typedParams: ParamsT;
      payload: PayloadT;
    },
  ResponseT
>;

export type ParameterizedMiddleware<
  ParamsT = {},
  StateT = {},
  ContextT = {},
> = (
  ctx: ParameterizedContext<ParamsT, StateT, ContextT>,
  next: Next,
) => Promise<void> | void;

export type RouteHandler<
  ParamsT,
  StateT,
  ContextT,
  PayloadT = unknown,
  ResponseT = unknown,
> = (
  ctx: ParameterizedContext<ParamsT, StateT, ContextT, PayloadT, ResponseT>,
  next: Next,
) => Promise<void> | void;

export type MiddlewareDefinition = {
  kind: "middleware";
  middleware: Array<ParameterizedMiddleware>;
  options?: UseOptions | undefined;
};

export type HandlerDefinition = {
  kind: "handler";
  middleware: Array<ParameterizedMiddleware>;
  method: HTTPMethod;
};

export type RouteDefinitionItem = MiddlewareDefinition | HandlerDefinition;

export type DefineRouteHelpers<
  ParamsT,
  StateT,
  ContextT,
  OptionalHandlers = undefined,
> = {
  // INFO: The `use` helper intentionally does not accept type parameters.
  // PayloadT and ResponseT are only relevant to route handlers,
  // as different request methods receive different payloads and return different responses.
  // Allowing these type parameters on `use` would be misleading,
  // since middleware operates across multiple request methods with varying types.
  use: (
    middleware:
      | ParameterizedMiddleware<ParamsT, StateT, ContextT>
      | Array<ParameterizedMiddleware<ParamsT, StateT, ContextT>>,
    options?: UseOptions,
  ) => RouteDefinitionItem;
} & {
  [M in HTTPMethod]: M extends OptionalHandlers
    ? <PayloadT = unknown, ResponseT = unknown>(
        handler?:
          | RouteHandler<ParamsT, StateT, ContextT, PayloadT, ResponseT>
          | Array<RouteHandler<ParamsT, StateT, ContextT, PayloadT, ResponseT>>,
      ) => RouteDefinitionItem
    : <PayloadT = unknown, ResponseT = unknown>(
        handler:
          | RouteHandler<ParamsT, StateT, ContextT, PayloadT, ResponseT>
          | Array<RouteHandler<ParamsT, StateT, ContextT, PayloadT, ResponseT>>,
      ) => RouteDefinitionItem;
};

export type DefineRoute = <
  ParamsT = Record<string, string>,
  StateT = object,
  ContextT = object,
>(
  factory: (
    helpers: DefineRouteHelpers<ParamsT, StateT, ContextT>,
  ) => Array<RouteDefinitionItem>,
) => Array<RouteDefinitionItem>;

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

export type Use = <StateT = DefaultState, ContextT = DefaultContext>(
  middleware:
    | ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
    | Array<ParameterizedMiddleware<Record<string, string>, StateT, ContextT>>,
  options?: UseOptions,
) => MiddlewareDefinition;

export type RouterRouteSource = {
  name: string;
  path: string;
  file: string;
  // useWrappers is same as defining middleware inside route definition,
  // just automatically imported from use.ts files
  useWrappers: [...a: Array<MiddlewareDefinition>];
  definitionItems: Array<RouteDefinitionItem>;
  params: Array<[name: string, isRest?: boolean]>;
  numericParams: Array<string>;
  validationSchemas: ValidationSchemas;
  meta?: Record<string, unknown>;
};

export type RouterRoute = {
  name: string;
  path: string;
  file: string;
  methods: Array<string>;
  middleware: Array<RouterMiddleware>;
  debug: {
    headline: string;
    methods: string;
    middleware: string;
    handler: string;
    full: string;
  };
};

import type Koa from "koa";
export type App = Koa<DefaultState, DefaultContext>;
export type AppOptions = ConstructorParameters<typeof import("koa")>[0];

export type Router = import("@koa/router").Router<DefaultState, DefaultContext>;
export type RouterOptions = import("@koa/router").RouterOptions;

export type DevMiddlewareFactory = (
  app: App,
) => (
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
  next: () => Promise<void>,
) => Promise<void>;
export type TeardownHandler = (app: App) => void | Promise<void>;

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
