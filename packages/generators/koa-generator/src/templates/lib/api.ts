import type { RouterContext } from "@koa/router";
import type { Next } from "koa";

import type { MiddlewareDefinition, UseOptions } from "@kosmojs/api";

export interface DefaultState {}

export interface DefaultContext {}

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

export type Use = <StateT = DefaultState, ContextT = DefaultContext>(
  middleware:
    | ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
    | Array<ParameterizedMiddleware<Record<string, string>, StateT, ContextT>>,
  options?: UseOptions,
) => MiddlewareDefinition<ParameterizedMiddleware<{}, StateT, ContextT>>;

export const use: Use = (middleware, options) => {
  return {
    kind: "middleware",
    middleware: [middleware].flat() as never,
    options,
  };
};
