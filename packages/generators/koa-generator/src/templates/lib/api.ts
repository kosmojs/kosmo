import type { RouterContext } from "@koa/router";
import type { Next } from "koa";

import type {
  ExtendContext,
  HandlerDefinition,
  HTTPMethod,
  MiddlewareDefinition,
  RouteDefinitionItem,
  UseOptions,
  ValidationDefmap,
  ValidationOptmap,
} from "@kosmojs/api";

import type { BodyparserOptions } from "./@api/bodyparser";
import type { RouteMap } from "./@api/routes";

export interface DefaultState {}
export interface DefaultContext {}

type ExtractBodies<R> = R extends [number, string, infer Body] ? Body : never;

type ValidatedResponseBodies<VDefs extends ValidationDefmap> = [
  ExtractBodies<VDefs["response"]>,
] extends [never]
  ? unknown // No bodies extracted at all - fallback to unknown
  : ExtractBodies<VDefs["response"]>;

export type ParameterizedContext<
  ParamsT,
  StateT,
  ContextT,
  VDefs extends ValidationDefmap = {},
  VOpts extends ValidationOptmap = {},
> = RouterContext<
  DefaultState & StateT,
  DefaultContext &
    ContextT &
    ExtendContext<ParamsT, VDefs, VOpts, BodyparserOptions>,
  ValidatedResponseBodies<VDefs>
>;

export type ParameterizedMiddleware<
  ParamsT = Record<string, string>,
  StateT = Record<string, unknown>,
  ContextT = Record<string, unknown>,
> = (
  ctx: ParameterizedContext<ParamsT, StateT, ContextT>,
  next: Next,
) => Promise<void> | void;

export type Use = <StateT = DefaultState, ContextT = DefaultContext>(
  middleware:
    | ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
    | Array<ParameterizedMiddleware<Record<string, string>, StateT, ContextT>>,
  options?: UseOptions,
) => MiddlewareDefinition<
  ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
>;

export type RouteHandler<
  ParamsT,
  StateT,
  ContextT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap = {},
> = (
  ctx: ParameterizedContext<ParamsT, StateT, ContextT, VDefs, VOpts>,
  next: Next,
) => Promise<void> | void;

export type DefineRouteFactory<ParamsT, StateT, ContextT> = (
  a: {
    // INFO: The `use` helper intentionally does not accept validation types.
    // Allowing these type parameters on `use` would be misleading,
    // since middleware operates across multiple request methods with varying types.
    use: (
      middleware:
        | ParameterizedMiddleware<ParamsT, StateT, ContextT>
        | Array<ParameterizedMiddleware<ParamsT, StateT, ContextT>>,
      options?: UseOptions,
    ) => MiddlewareDefinition<
      ParameterizedMiddleware<ParamsT, StateT, ContextT>
    >;
  } & {
    [M in HTTPMethod]: <
      VDefs extends ValidationDefmap,
      VOpts extends ValidationOptmap = {},
    >(
      handler:
        | RouteHandler<ParamsT, StateT, ContextT, VDefs, VOpts>
        | Array<RouteHandler<ParamsT, StateT, ContextT, VDefs, VOpts>>,
    ) => HandlerDefinition<ParameterizedMiddleware<ParamsT, StateT, ContextT>>;
  },
) => Array<
  RouteDefinitionItem<ParameterizedMiddleware<ParamsT, StateT, ContextT>>
>;

type ParamsMap<
  Mappings extends Array<[string, unknown, boolean]>,
  Refinements extends Array<unknown>,
> = {
  [I in Extract<keyof Mappings, `${number}`> as Mappings[I] extends [
    infer ParamName extends string,
    ...Array<unknown>,
  ]
    ? ParamName
    : never]: Mappings[I] extends [string, infer Default, true]
    ? I extends keyof Refinements
      ? Refinements[I]
      : Default
    : Mappings[I] extends [string, infer Default, false]
      ? I extends keyof Refinements
        ? Refinements[I] | undefined
        : Default | undefined
      : never;
};

export const use: Use = (middleware, options) => {
  return {
    kind: "middleware",
    middleware: [middleware].flat() as never,
    options,
  };
};

export const defineRoute: <
  R extends keyof RouteMap,
  ParamsD extends RouteMap[R]["paramsDefaults"] = RouteMap[R]["paramsDefaults"],
  StateT extends object = object,
  ContextT extends object = object,
>(
  factory: DefineRouteFactory<
    ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
    StateT,
    ContextT
  >,
) => Array<
  RouteDefinitionItem<
    ParameterizedMiddleware<
      ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
      StateT,
      ContextT
    >
  >
> = (factory) => {
  const createHandler = <MiddlewareT>(method: HTTPMethod) => {
    return (middleware: MiddlewareT | Array<MiddlewareT>) => {
      return {
        kind: "handler",
        method,
        middleware: [middleware].flat(),
      };
    };
  };
  return factory({
    HEAD: createHandler("HEAD") as never,
    OPTIONS: createHandler("OPTIONS") as never,
    GET: createHandler("GET") as never,
    POST: createHandler("POST") as never,
    PUT: createHandler("PUT") as never,
    PATCH: createHandler("PATCH") as never,
    DELETE: createHandler("DELETE") as never,
    // route-specific `use`, contains types for current route
    use: use as never,
  });
};
