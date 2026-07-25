import type { Context } from "hono";

import type { RequestBodyTarget, RequestMetadataTarget } from "@kosmojs/core";
import { parseCookies, parseQuerystring } from "@kosmojs/core/api";

export type BodyparserOptions = {
  json: never;
  form: { all?: boolean; dot?: boolean };
  raw: { as?: "text" | "arrayBuffer" | "blob" | "formData" };
};

export const metaparsers: {
  [T in RequestMetadataTarget]: (ctx: Context) => unknown;
} = {
  query(ctx) {
    return parseQuerystring(ctx.req.url);
  },

  headers(ctx) {
    return Object.fromEntries(ctx.req.raw.headers);
  },

  cookies(ctx) {
    return parseCookies(Object.fromEntries(ctx.req.raw.headers));
  },
};

export const bodyparsers: {
  [T in RequestBodyTarget]: (
    ctx: Context,
    opt?: BodyparserOptions[T],
  ) => Promise<unknown>;
} = {
  json(ctx) {
    return ctx.req.json();
  },

  form(ctx, opt) {
    return ctx.req.parseBody(opt);
  },

  raw(ctx, { as = "text" } = {}) {
    return ctx.req[as]();
  },
};
