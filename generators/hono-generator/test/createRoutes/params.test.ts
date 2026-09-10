import { describe, expect, test } from "vitest";

import { createPathPattern, pathTokensFactory } from "@kosmojs/lib";

import { defineRoute, middlewareStackBuilder, runMiddleware } from "..";

describe("createRouterRoutes", () => {
  describe("params", () => {
    test("splat params", async () => {
      const pathTokens = pathTokensFactory("{...path}");
      const pathPattern = createPathPattern(pathTokens);
      const params = { path: ["a", "b", "c"] };

      const stack = middlewareStackBuilder(
        [
          {
            name: "{...path}",
            pathPattern,
            params: Object.keys(params),
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
        { path: "/a/b/c" },
      );

      const body = await res.json();

      expect(body).toEqual(params);
    });

    test("numeric params", async () => {
      const pathTokens = pathTokensFactory("[id]/[name]");
      const pathPattern = createPathPattern(pathTokens);
      const params = { id: 0, name: "name" };

      const stack = middlewareStackBuilder(
        [
          {
            name: "[id]/[name]",
            pathPattern: `/${pathPattern}`,
            params: Object.keys(params),
            numericProperties: { params: ["id"], query: {} },
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
        { path: "/0/name" },
      );

      const body = await res.json();

      expect(body).toEqual(params);
    });

    test("splat numeric params", async () => {
      const pathTokens = pathTokensFactory("{...ids}");
      const pathPattern = createPathPattern(pathTokens);
      const params = { ids: [1, 2, 3] };

      const stack = middlewareStackBuilder(
        [
          {
            name: "{...ids}",
            pathPattern,
            params: Object.keys(params),
            numericProperties: { params: ["ids"], query: {} },
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
        { path: "/1/2/3" },
      );

      const body = await res.json();

      expect(body).toEqual(params);
    });
  });
});
