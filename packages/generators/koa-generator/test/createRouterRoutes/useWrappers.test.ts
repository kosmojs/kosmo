import { describe, expect, it } from "vitest";

import { middlewareStackBuilder } from "..";

import { use } from "@src/templates/lib/api";
import { defineRouteFactory } from "@src/templates/lib/api:route";

describe("createRouterRoutes", () => {
  async function validateParams() {}
  async function validateBody() {}
  async function validateResponse() {}

  describe("useWrappers", () => {
    it("overrides global middleware", () => {
      const [stack] = middlewareStackBuilder(
        [
          {
            useWrappers: [
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
            definitionItems: defineRouteFactory(({ use, GET }) => [
              use(validateBody, { slot: "validate:json" }),
              use(validateParams, { slot: "validate:params" }),
              use(validateResponse, { slot: "validate:response" }),
              GET(async function get() {}),
            ]),
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
