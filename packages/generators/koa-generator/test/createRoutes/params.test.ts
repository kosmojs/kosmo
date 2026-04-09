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
            params: ["path"],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]) as never,
          },
        ],
        {},
      );

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/a/b/c",
        },
      );

      expect(ctx.body).toEqual({ path: ["a", "b", "c"] });
    });

    test("numeric params", async () => {
      const pathTokens = pathTokensFactory("[id]/[name]");
      const pathPattern = createPathPattern(pathTokens);

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern: `/${pathPattern}`,
            params: ["id", "name"],
            numericParams: ["id"],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]) as never,
          },
        ],
        {},
      );

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/0/name",
        },
      );

      expect(ctx.body).toEqual({ id: 0, name: "name" });
    });

    test("splat numeric params", async () => {
      const pathTokens = pathTokensFactory("{...ids}");
      const pathPattern = createPathPattern(pathTokens);

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: ["ids"],
            numericParams: ["ids"],
            definitionItems: defineRoute(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]) as never,
          },
        ],
        {},
      );

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        {
          path: "/1/2/3",
        },
      );

      expect(ctx.body).toEqual({ ids: [1, 2, 3] });
    });
  });
});
