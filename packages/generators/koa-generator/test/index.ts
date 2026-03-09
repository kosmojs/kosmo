import type { IncomingMessage, ServerResponse } from "node:http";

import Koa, { type Next } from "koa";
import compose from "koa-compose";
import { type InjectPayload, inject } from "light-my-request";

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
      createRouteMiddleware: createRouteMiddleware as never,
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
  middleware: Array<(ctx: T, next: Next) => void | Promise<void>>,
  { path = "/", ...payload }: Payload,
) => {
  const app = new Koa();

  const payloadOptions = ({ json, form, raw }: Partial<Payload>) => {
    if (form instanceof FormData) {
      return {
        payload: form,
      };
    }

    let contentType: string | undefined;
    let payload: unknown;
    let buffer: Buffer | undefined;

    if (json !== undefined) {
      contentType = "application/json";
      if (Buffer.isBuffer(json)) {
        payload = json;
        buffer = json;
      } else {
        payload = JSON.stringify(json);
      }
    } else if (form) {
      contentType = "application/x-www-form-urlencoded";
      payload = new URLSearchParams(form as never).toString();
    } else if (raw) {
      contentType = "application/octet-stream";
      payload = raw;
      buffer = raw instanceof Buffer ? raw : undefined;
    }

    const headers: Record<string, string> = {};

    if (contentType) {
      headers["content-type"] = contentType;
    }

    if (buffer?.[0] === 0x1f && buffer?.[1] === 0x8b) {
      headers["content-encoding"] = "gzip";
    }

    return {
      headers,
      payload: payload as InjectPayload,
    };
  };

  const { req, res } = await new Promise<{
    req: IncomingMessage;
    res: ServerResponse;
  }>((resolve) => {
    inject(
      (req, res) => resolve({ req, res }),
      payload
        ? { method: "POST", url: path, ...payloadOptions(payload) }
        : { method: "GET", url: path },
    );
  });

  // create real Koa context
  const ctx = app.createContext(req, res);

  const fn = compose(middleware);
  await fn(ctx as never);

  return ctx;
};
