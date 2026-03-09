import { Hono, type Next } from "hono";

import {
  createRoutes,
  HTTPMethods,
  type MiddlewareDefinition,
  type RouteSource,
} from "@kosmojs/api";

import {
  defineRoute,
  type ParameterizedMiddleware,
  use,
} from "@src/templates/lib/api";
import { createRouteMiddleware } from "@src/templates/lib/api-factory";

export { defineRoute, use, type ParameterizedMiddleware };

export const defaultMethods = Object.keys(HTTPMethods);

export const middlewareStackBuilder = (
  a: Array<Partial<RouteSource<ParameterizedMiddleware>>>,
  b?: {
    globalMiddleware?: Array<MiddlewareDefinition<ParameterizedMiddleware>>;
  },
) => {
  return createRoutes<ParameterizedMiddleware, ParameterizedMiddleware>(
    a.map((e) => {
      return {
        name: "",
        path: "",
        pathPattern: "",
        file: "",
        cascadingMiddleware: [],
        definitionItems: defineRoute(({ GET }) => [
          GET(async function get() {}),
        ]) as never,
        params: [],
        numericParams: [],
        validationSchemas: {},
        ...(e as Partial<RouteSource<ParameterizedMiddleware>>),
      };
    }),
    {
      globalMiddleware: b?.globalMiddleware || [],
      createRouteMiddleware,
    },
  );
};

type Payload = Partial<{
  path: string;
  json: unknown;
  form: Record<string, unknown> | FormData;
  raw: Buffer | string;
}>;

export const runMiddleware = async <T = any>(
  middleware: Array<(ctx: T, next: Next) => Promise<unknown> | unknown>,
  { path = "/", ...payload }: Payload,
) => {
  const app = new Hono();

  for (const fn of middleware) {
    app.use(fn as never);
  }

  const requestInit = (): RequestInit => {
    if (!Object.keys(payload).length) {
      return {
        method: "GET",
      };
    }

    const { json, form, raw } = payload;

    if (form instanceof FormData) {
      return {
        method: "POST",
        body: form,
      };
    }

    let contentType: string | undefined;
    let body: unknown;

    if (json !== undefined) {
      contentType = "application/json";
      if (Buffer.isBuffer(json)) {
        body = json;
      } else {
        body = JSON.stringify(json);
      }
    } else if (form) {
      contentType = "application/x-www-form-urlencoded";
      body = new URLSearchParams(form as never).toString();
    } else if (raw) {
      contentType = "application/octet-stream";
      body = raw;
    }

    const headers: Record<string, string> = {};

    if (contentType) {
      headers["content-type"] = contentType;
    }

    return {
      method: "POST",
      headers,
      body: body as never,
    };
  };

  return app.request(path, requestInit());
};
