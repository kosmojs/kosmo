import type { Context } from "hono";

import {
  parseCookies,
  parseSearchParams,
  type RequestBodyTarget,
  type RequestMetadataParser,
} from "@kosmojs/core";
import { createParamsNormalizers, type RouteSource } from "@kosmojs/core/api";

import type { ParameterizedMiddleware } from "../api";

export type BodyparserOptions = {
  json: never;
  form: { all?: boolean; dot?: boolean };
  raw: { as?: "text" | "arrayBuffer" | "blob" | "formData" };
};

export const createMetaparsers: (
  r: RouteSource<ParameterizedMiddleware>,
  ctx: Context,
) => Record<RequestMetadataParser, () => unknown> = (routeSource, ctx) => {
  const {
    //
    normalizeParams,
    normalizeSearchParams,
  } = createParamsNormalizers<ParameterizedMiddleware>(routeSource);

  return {
    method() {
      return ctx.req.method;
    },

    pathname() {
      return ctx.req.path;
    },

    params() {
      return normalizeParams(ctx.req.path);
    },

    query() {
      return normalizeSearchParams(
        parseSearchParams(ctx.req.url),
        ctx.req.method,
      );
    },

    headers() {
      return Object.fromEntries(ctx.req.raw.headers);
    },

    cookies() {
      return parseCookies(Object.fromEntries(ctx.req.raw.headers));
    },
  };
};

export const createBodyparsers: (
  r: RouteSource<ParameterizedMiddleware>,
  ctx: Context,
) => {
  [T in RequestBodyTarget]: (opt?: BodyparserOptions[T]) => Promise<unknown>;
} = (_routeSource, ctx) => {
  return {
    json() {
      return ctx.req.json();
    },

    form(opt) {
      return ctx.req.parseBody(opt);
    },

    raw({ as = "text" } = {}) {
      return ctx.req[as]();
    },
  };
};
