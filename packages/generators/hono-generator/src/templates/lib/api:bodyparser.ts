import type { Context } from "hono";

import type { RequestBodyTarget } from "@kosmojs/api";

export type BodyparserOptions = {
  json: never;
  form: { all?: boolean; dot?: boolean };
  raw: { as?: "text" | "arrayBuffer" | "blob" | "formData" };
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
