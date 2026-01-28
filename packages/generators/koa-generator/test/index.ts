import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

import Koa, { type Context, type Next } from "koa";
import compose from "koa-compose";
import { vi } from "vitest";

import {
  createRouterRoutes,
  HTTPMethods,
  type MiddlewareDefinition,
  type RouterRouteSource,
} from "@kosmojs/api";

import type { ParameterizedMiddleware } from "@/templates/lib/api";
import { defineRouteFactory } from "@/templates/lib/api:route";
import {
  createParamsMiddleware,
  createValidationMiddleware,
} from "@/templates/lib/api:router";

vi.mock("{{ createImport 'api' 'use' }}", () => ({
  default: [],
}));

vi.mock("{{ createImport 'lib' 'api:routes' }}", () => ({
  routeSources: [],
}));

export const defaultMethods = Object.keys(HTTPMethods);

export const middlewareStackBuilder = (
  a: Array<Partial<RouterRouteSource<ParameterizedMiddleware>>>,
  b: {
    globalMiddleware?: Array<MiddlewareDefinition<ParameterizedMiddleware>>;
  },
) => {
  return createRouterRoutes<ParameterizedMiddleware, ParameterizedMiddleware>(
    a.map((e) => {
      return {
        name: "",
        path: "",
        file: "",
        useWrappers: [],
        definitionItems: defineRouteFactory(({ GET }) => [
          GET(async function get() {}),
        ]),
        params: [],
        numericParams: [],
        validationSchemas: {},
        ...(e as Partial<RouterRouteSource<ParameterizedMiddleware>>),
      };
    }),
    b?.globalMiddleware || [],
    {
      createParamsMiddleware,
      createValidationMiddleware,
    },
  );
};

export const runMiddleware = async <T = any>(
  middleware: Array<(ctx: T, next: Next) => void | Promise<void>>,
  ctxOverrides: Partial<Context> = {},
) => {
  const app = new Koa();

  const req = new IncomingMessage(new Socket());
  const res = new ServerResponse(req);

  // create real Koa context
  const ctx = app.createContext(req, res);

  // apply overrides for testing
  Object.assign(ctx, ctxOverrides);

  const fn = compose(middleware);
  await fn(ctx as never);

  return ctx;
};
