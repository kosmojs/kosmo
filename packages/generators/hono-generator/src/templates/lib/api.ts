import type { Context, Next } from "hono";

import type { ValidationDefmap, ValidationOptmap } from "@kosmojs/core";
import type {
  ExtendContext,
  HandlerDefinition,
  HTTPMethod,
  MiddlewareDefinition,
  RouteDefinitionItem,
  UseOptions,
} from "@kosmojs/core/api";

import type { BodyparserOptions } from "./@api/bodyparser";
import type { RouteMap } from "./@api/routes";

export interface DefaultVariables {}
export interface DefaultBindings {}

type ExtractJsonBody<R> = R extends [
  number,
  `${string}json${string}`,
  infer Body,
]
  ? Body
  : never;

type ExtractJsonStatus<R> = R extends [
  infer S extends number,
  `${string}json${string}`,
  ...unknown[],
]
  ? S extends 300 | 301 | 302 | 303 | 304 | 307 | 308
    ? never
    : S
  : never;

type ResponseJsonOverride<VDefs extends ValidationDefmap> = [
  ExtractJsonBody<VDefs["response"]>,
] extends [never]
  ? {}
  : {
      json: (
        body: ExtractJsonBody<VDefs["response"]>,
        status?: ExtractJsonStatus<VDefs["response"]>,
      ) => Response;
    };

export type ParameterizedContext<
  ParamsT,
  VariablesT,
  BindingsT,
  VDefs extends ValidationDefmap = {},
  VOpts extends ValidationOptmap = {},
> = Context<{
  Bindings: DefaultBindings & BindingsT;
  Variables: DefaultVariables & VariablesT;
}> &
  ExtendContext<ParamsT, VDefs, VOpts, BodyparserOptions> &
  ResponseJsonOverride<VDefs>;

export type ParameterizedMiddleware<
  ParamsT = Record<string, string>,
  VariablesT = Record<string, unknown>,
  BindingsT = Record<string, unknown>,
> = (
  ctx: ParameterizedContext<ParamsT, VariablesT, BindingsT>,
  next: Next,
) => Promise<unknown> | unknown;

export type Use = <VariablesT = DefaultVariables, BindingsT = DefaultBindings>(
  middleware:
    | ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
    | Array<
        ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
      >,
  options?: UseOptions,
) => MiddlewareDefinition<
  ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
>;

export const use: Use = (middleware, options) => {
  return {
    kind: "middleware",
    middleware: [middleware].flat() as never,
    options,
  };
};

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

export const defineRoute: <
  R extends keyof RouteMap,
  ParamsD extends RouteMap[R]["paramsDefaults"] = RouteMap[R]["paramsDefaults"],
  VariablesT extends object = object,
  BindingsT extends object = object,
>(
  factory: DefineRouteFactory<
    ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
    VariablesT,
    BindingsT
  >,
) => Array<
  RouteDefinitionItem<
    ParameterizedMiddleware<
      ParamsMap<RouteMap[R]["paramsMappings"], ParamsD>,
      VariablesT,
      BindingsT
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
