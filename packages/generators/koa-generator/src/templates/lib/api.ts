import type { RouterContext } from "@koa/router";
import type { Next } from "koa";

import type {
  ExtendContext,
  MiddlewareDefinition,
  UseOptions,
  ValidatedResponseBodies,
  ValidationDefmap,
  ValidationOptmap,
} from "@kosmojs/api";

import type { BodyparserOptions } from "./api:bodyparser";

export interface DefaultState {}

export interface DefaultContext {}

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

export const use: Use = (middleware, options) => {
  return {
    kind: "middleware",
    middleware: [middleware].flat() as never,
    options,
  };
};
