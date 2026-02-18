import type { IncomingMessage, ServerResponse } from "node:http";

import type FormData from "form-data";
import Koa, { type Next } from "koa";
import compose from "koa-compose";
import { type InjectPayload, inject } from "light-my-request";
import { vi } from "vitest";

import {
  createRouterRoutes,
  HTTPMethods,
  type MiddlewareDefinition,
  type RouterRouteSource,
} from "@kosmojs/api";

import type { ParameterizedMiddleware } from "@src/templates/lib/api";
import { defineRouteFactory } from "@src/templates/lib/api:route";
import { createRouteMiddleware } from "@src/templates/lib/api:router";

vi.mock("{{ createImport 'api' 'use' }}", () => ({
  default: [],
}));

vi.mock("{{ createImport 'lib' 'api:routes' }}", () => ({
  routeSources: [],
}));

export const defaultMethods = Object.keys(HTTPMethods);

export const middlewareStackBuilder = (
  a: Array<Partial<RouterRouteSource<ParameterizedMiddleware>>>,
  b?: {
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
    {
      globalMiddleware: b?.globalMiddleware || [],
      createRouteMiddleware,
    },
  );
};

type Payload = Partial<{
  params: Record<string, unknown>;
  json: unknown;
  form: Record<string, unknown>;
  multipart: FormData;
  raw: Buffer | string;
}>;

export const runMiddleware = async <T = any>(
  middleware: Array<(ctx: T, next: Next) => void | Promise<void>>,
  payload?: Payload,
) => {
  const url = "/";
  const app = new Koa();

  const payloadOptions = ({ json, form, multipart, raw }: Partial<Payload>) => {
    if (multipart) {
      return {
        headers: multipart.getHeaders(),
        payload: multipart,
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
        ? { method: "POST", url, ...payloadOptions(payload) }
        : { method: "GET", url },
    );
  });

  // create real Koa context
  const ctx = app.createContext(req, res);

  Object.assign(ctx, {
    ...(payload?.params ? { params: payload.params } : {}),
  });

  const fn = compose(middleware);
  await fn(ctx as never);

  return ctx;
};
