import KoaRouter, { type RouterMiddleware } from "@koa/router";

import {
  createRouterRoutes,
  type RouterFactory,
  type RouterRouteSource,
  type ValidationSchemas,
} from "@kosmojs/api";

import {
  type DefaultContext,
  type DefaultState,
  type ParameterizedMiddleware,
  use,
} from "./api";

import globalMiddleware from "{{ createImport 'api' 'use' }}";
import { routeSources } from "{{ createImport 'lib' 'api:routes' }}";

export type Router = import("@koa/router").Router<DefaultState, DefaultContext>;
export type RouterOptions = import("@koa/router").RouterOptions;

export const createParamsMiddleware = (
  params: RouterRouteSource<ParameterizedMiddleware>["params"],
  numericParams: RouterRouteSource<ParameterizedMiddleware>["numericParams"],
) => [
  use(
    function useParams(ctx, next) {
      ctx.typedParams = params.reduce(
        (map: Record<string, unknown>, [name, isRest]) => {
          const value = ctx.params[name];
          if (value) {
            if (isRest) {
              map[name] = numericParams.includes(name)
                ? value.split("/").map(Number)
                : value.split("/");
            } else {
              map[name] = numericParams.includes(name) ? Number(value) : value;
            }
          } else {
            map[name] = value;
          }
          return map;
        },
        {},
      ) as never;
      return next();
    },
    { slot: "params" },
  ),
];

export const createValidationMiddleware = (
  validationSchemas: ValidationSchemas,
) => [
  use(
    function useValidateParams(ctx, next) {
      validationSchemas.params?.validate(ctx.typedParams);
      return next();
    },
    { slot: "validateParams" },
  ),

  use(
    function useValidatePayload(ctx, next) {
      validationSchemas.payload?.[ctx.method]?.validate(ctx.payload);
      return next();
    },
    {
      slot: "validatePayload",
      on: Object.keys(validationSchemas.payload || {}) as never,
    },
  ),

  use(
    async function useValidateResponse(ctx, next) {
      if (validationSchemas.response?.[ctx.method]) {
        await next();
        validationSchemas.response?.[ctx.method]?.validate(ctx.body);
      } else {
        return next();
      }
    },
    {
      slot: "validateResponse",
      on: Object.keys(validationSchemas.response || {}) as never,
    },
  ),
];

export const routes = createRouterRoutes<
  ParameterizedMiddleware,
  RouterMiddleware
>(routeSources as never, globalMiddleware as never, {
  createParamsMiddleware,
  createValidationMiddleware,
});

export const routerFactory: RouterFactory<Router, RouterOptions> = (
  factory,
) => {
  const createRouter = (options?: RouterOptions): Router => {
    return new KoaRouter(options);
  };
  return factory({ createRouter });
};
