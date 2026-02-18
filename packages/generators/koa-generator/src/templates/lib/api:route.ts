import type { Next } from "koa";

import type {
  HandlerDefinition,
  HTTPMethod,
  MiddlewareDefinition,
  RouteDefinitionItem,
  UseOptions,
  ValidationDefmap,
  ValidationOptmap,
} from "@kosmojs/api";

import {
  type ParameterizedContext,
  type ParameterizedMiddleware,
  use,
} from "./api";

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

export const defineRouteFactory: <
  ParamsT = Record<string, string>,
  StateT = Record<string, unknown>,
  ContextT = Record<string, unknown>,
>(
  factory: DefineRouteFactory<ParamsT, StateT, ContextT>,
) => Array<
  RouteDefinitionItem<ParameterizedMiddleware<ParamsT, StateT, ContextT>>
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
    use: use as never,
    HEAD: createHandler("HEAD") as never,
    OPTIONS: createHandler("OPTIONS") as never,
    GET: createHandler("GET") as never,
    POST: createHandler("POST") as never,
    PUT: createHandler("PUT") as never,
    PATCH: createHandler("PATCH") as never,
    DELETE: createHandler("DELETE") as never,
  });
};
