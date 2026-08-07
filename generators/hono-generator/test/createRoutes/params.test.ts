import { describe, expect, test } from "vitest";

import { createPathPattern, pathTokensFactory } from "@kosmojs/lib";

import { defineRoute, middlewareStackBuilder, runMiddleware } from "..";

describe("createRouterRoutes", () => {
  describe("params", () => {
    test("splat params", async () => {
      const pathTokens = pathTokensFactory("{...path}");
      const pathPattern = createPathPattern(pathTokens);

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: [{ name: "path", kind: "splat", type: "string" }],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                return ctx.json(ctx.validated.params);
              }),
            ]) as never,
          },
        ],
        {},
      );

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/a/b/c",
        },
      );

      const body = await res.json();

      expect(body).toEqual({ path: ["a", "b", "c"] });
    });

    test("numeric params", async () => {
      const pathTokens = pathTokensFactory("[id]/[name]");
      const pathPattern = createPathPattern(pathTokens);

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern: `/${pathPattern}`,
            params: [
              { name: "id", kind: "required", type: "number" },
              { name: "name", kind: "required", type: "string" },
            ],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                return ctx.json(ctx.validated.params);
              }),
            ]) as never,
          },
        ],
        {},
      );

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/0/name",
        },
      );

      const body = await res.json();

      expect(body).toEqual({ id: 0, name: "name" });
    });

    test("splat numeric params", async () => {
      const pathTokens = pathTokensFactory("{...ids}");
      const pathPattern = createPathPattern(pathTokens);

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: [{ name: "ids", kind: "splat", type: "number" }],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                return ctx.json(ctx.validated.params);
              }),
            ]) as never,
          },
        ],
        {},
      );

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/1/2/3",
        },
      );

      const body = await res.json();

      expect(body).toEqual({ ids: [1, 2, 3] });
    });
  });
});
