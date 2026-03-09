import { describe, expect, test } from "vitest";

import { pathTokensFactory } from "@kosmojs/dev";

import { defineRoute, middlewareStackBuilder, runMiddleware } from "..";

describe("createRouterRoutes", () => {
  describe("params", () => {
    test("splat params", async () => {
      const [, pathPattern] = pathTokensFactory("{...path}");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: ["path"],
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
      const [, pathPattern] = pathTokensFactory("[id]/[name]");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern: `/${pathPattern}`,
            params: ["id", "name"],
            numericParams: ["id"],
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
      const [, pathPattern] = pathTokensFactory("{...ids}");

      const stack = middlewareStackBuilder(
        [
          {
            pathPattern,
            params: ["ids"],
            numericParams: ["ids"],
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
