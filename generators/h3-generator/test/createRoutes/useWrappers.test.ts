import { describe, expect, it } from "vitest";

import { defineRoute, middlewareStackBuilder, use } from "..";

describe("createRouterRoutes", () => {
  async function validateParams() {}
  async function validateBody() {}
  async function validateResponse() {}

  describe("cascadingMiddleware", () => {
    it("overrides global middleware", () => {
      const [stack] = middlewareStackBuilder(
        [
          {
            cascadingMiddleware: [
              use(validateBody, { slot: "validate:json" }),
              use(validateParams, { slot: "validate:params" }),
              use(validateResponse, { slot: "validate:response" }),
            ],
          },
        ],
        {},
      );

      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(validateBody);
      expect(stack.middleware[3]).toEqual(validateResponse);

      expect(stack.middleware.length).toEqual(5);
    });

    it("is overridden by route middleware", () => {
      const [stack] = middlewareStackBuilder(
        [
          {
            definitionItems: defineRoute(({ use, GET }) => [
              use(validateBody, { slot: "validate:json" }),
              use(validateParams, { slot: "validate:params" }),
              use(validateResponse, { slot: "validate:response" }),
              GET(async function get() {}),
            ]) as never,
          },
        ],
        {
          globalMiddleware: [
            use(() => {}, { slot: "validate:json" }),
            use(() => {}, { slot: "validate:params" }),
            use(() => {}, { slot: "validate:response" }),
          ],
        },
      );

      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(validateBody);
      expect(stack.middleware[3]).toEqual(validateResponse);

      expect(stack.middleware.length).toEqual(5);
    });
  });
});
