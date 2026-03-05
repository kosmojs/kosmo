import type { Context, Next } from "hono";

import type {
  ExtendContext,
  MiddlewareDefinition,
  UseOptions,
  ValidationDefmap,
  ValidationOptmap,
} from "@kosmojs/api";

import type { BodyparserOptions } from "./api:bodyparser";

export interface DefaultVariables {}

export interface DefaultBindings {}

declare global {
  var PRODUCTION_BUILD: boolean;
}

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
