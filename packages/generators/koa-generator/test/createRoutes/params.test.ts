import { describe, expect, test } from "vitest";

import { pathTokensFactory } from "@kosmojs/dev";

import { middlewareStackBuilder, runMiddleware } from "..";

import { defineRouteFactory } from "@src/index";

describe("createRouterRoutes", () => {
  describe("params", () => {
    test("splat params", async () => {
      const [, pathPattern] = pathTokensFactory("{...path}");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: ["path"],
            definitionItems: defineRouteFactory(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]),
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
      const [, pathPattern] = pathTokensFactory(":id/:name");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern: `/${pathPattern}`,
            params: ["id", "name"],
            numericParams: ["id"],
            definitionItems: defineRouteFactory(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]),
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
      const [, pathPattern] = pathTokensFactory("{...ids}");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: ["ids"],
            numericParams: ["ids"],
            definitionItems: defineRouteFactory(({ GET }) => [
              GET((ctx) => {
                ctx.body = ctx.validated.params;
              }),
            ]),
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
