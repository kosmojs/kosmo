import type { Next } from "hono";

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
  VariablesT,
  BindingsT,
  VDefs extends ValidationDefmap,
  VOpts extends ValidationOptmap = {},
> = (
  ctx: ParameterizedContext<ParamsT, VariablesT, BindingsT, VDefs, VOpts>,
  next: Next,
) => Promise<unknown> | unknown;

export type DefineRouteFactory<ParamsT, VariablesT, BindingsT> = (
  a: {
    // NOTE: The `use` helper intentionally does not accept validation types.
    // Allowing these type parameters on `use` would be misleading,
    // since middleware operates across multiple request methods with varying types.
    use: (
      middleware:
        | ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>
        | Array<ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>>,
      options?: UseOptions,
    ) => MiddlewareDefinition<
      ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>
    >;
  } & {
    [M in HTTPMethod]: <
      VDefs extends ValidationDefmap,
      VOpts extends ValidationOptmap = {},
    >(
      handler:
        | RouteHandler<ParamsT, VariablesT, BindingsT, VDefs, VOpts>
        | Array<RouteHandler<ParamsT, VariablesT, BindingsT, VDefs, VOpts>>,
    ) => HandlerDefinition<
      ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>
    >;
  },
) => Array<
  RouteDefinitionItem<ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>>
>;

export const defineRouteFactory: <
  ParamsT = Record<string, string>,
  VariablesT = Record<string, unknown>,
  BindingsT = Record<string, unknown>,
>(
  factory: DefineRouteFactory<ParamsT, VariablesT, BindingsT>,
) => Array<
  RouteDefinitionItem<ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>>
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
