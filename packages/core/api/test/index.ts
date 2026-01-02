import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

import Koa, { type Context, type Next } from "koa";
import compose from "koa-compose";

import { createRouterRoutes, defineRoute } from "@/router";
import {
  HTTPMethods,
  type MiddlewareDefinition,
  type RouterRouteSource,
} from "@/types";

export const defaultMethods = Object.keys(HTTPMethods);

export const middlewareStackBuilder = (
  a: Array<Partial<RouterRouteSource>>,
  b: { coreMiddleware?: Array<MiddlewareDefinition> },
) => {
  return createRouterRoutes(
    a.map((e) => {
      return {
        name: "",
        path: "",
        file: "",
        useWrappers: [],
        definitionItems: defineRoute(({ GET }) => [
          GET(async function get() {}),
        ]),
        params: [],
        numericParams: [],
        validationSchemas: {},
        ...(e as Partial<RouterRouteSource>),
      };
    }),
    { coreMiddleware: b?.coreMiddleware || [] },
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
