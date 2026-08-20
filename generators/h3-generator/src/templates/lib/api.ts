import type { H3Event, H3EventContext } from "h3";

import type { ValidationDefmap, ValidationOptmap } from "@kosmojs/core";
import {
  use as createUse,
  type ExtendContext,
  type HandlerDefinition,
  type HTTPMethod,
  type MiddlewareDefinition,
  type RouteDefinitionItem,
  type UseOptions,
} from "@kosmojs/core/api";

import type { RouteMap } from "./@api/routes";

export interface DefaultContext extends H3EventContext {}

type MaybePromise<T = unknown> = T | Promise<T>;

type Next = () => MaybePromise<unknown | undefined>;

type ExtractBodies<R> = R extends [number, string, infer Body] ? Body : never;

type ValidatedResponseBodies<VDefs extends ValidationDefmap> = [
  ExtractBodies<VDefs["response"]>,
] extends [never]
  ? unknown // No bodies extracted at all - fallback to unknown
  : ExtractBodies<VDefs["response"]>;

export type ParameterizedEvent<
  ParamsT,
  ContextT,
  VDefs extends ValidationDefmap = {},
  VOpts extends ValidationOptmap = {},
> = H3Event & { context: DefaultContext } & ContextT &
  ExtendContext<ParamsT, VDefs, VOpts>;

export type ParameterizedMiddleware<
  ParamsT = Record<string, string>,
  ContextT = Record<string, unknown>,
> = (
  event: ParameterizedEvent<ParamsT, ContextT>,
  next: Next,
) => MaybePromise<unknown>;

export type RouteHandler<
  ParamsT,
  ContextT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap = {},
> = (
  event: ParameterizedEvent<ParamsT, ContextT, VDefs, VOpts>,
) => MaybePromise<ValidatedResponseBodies<VDefs>>;

export type DefineRouteFactory<ParamsT, ContextT> = (
  a: {
    // NOTE: The `use` helper intentionally does not accept validation types.
    // Allowing these type parameters on `use` would be misleading,
    // since middleware operates across multiple request methods with varying types.
    use: (
      middleware:
        | ParameterizedMiddleware<ParamsT, ContextT>
        | Array<ParameterizedMiddleware<ParamsT, ContextT>>,
      options?: UseOptions,
    ) => MiddlewareDefinition<ParameterizedMiddleware<ParamsT, ContextT>>;
  } & {
    [M in HTTPMethod]: <
      VDefs extends ValidationDefmap,
      VOpts extends ValidationOptmap = {},
    >(
      handler:
        | RouteHandler<ParamsT, ContextT, VDefs, VOpts>
        | Array<RouteHandler<ParamsT, ContextT, VDefs, VOpts>>,
    ) => HandlerDefinition<ParameterizedMiddleware<ParamsT, ContextT>>;
  },
) => Array<RouteDefinitionItem<ParameterizedMiddleware<ParamsT, ContextT>>>;

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

export const use = <ContextT = DefaultContext>(
  middleware:
    | ParameterizedMiddleware<Record<string, string>, ContextT>
    | Array<ParameterizedMiddleware<Record<string, string>, ContextT>>,
  options?: UseOptions,
) => {
  return createUse<ParameterizedMiddleware<Record<string, string>, ContextT>>(
    middleware,
    options,
  );
};

export const defineRoute: <
  R extends keyof RouteMap,
  ParamsD extends RouteMap[R]["paramsDefaults"] = RouteMap[R]["paramsDefaults"],
  ContextT extends object = object,
>(
  factory: DefineRouteFactory<
    ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
    ContextT & RouteMap[R]["cascadingState"]
  >,
) => Array<
  RouteDefinitionItem<
    ParameterizedMiddleware<
      ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
      ContextT & RouteMap[R]["cascadingState"]
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
