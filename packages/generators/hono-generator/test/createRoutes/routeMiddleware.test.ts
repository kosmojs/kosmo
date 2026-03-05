import { describe, expect, it, test } from "vitest";

import { middlewareStackBuilder } from "..";

import { use } from "@src/templates/lib/api";
import { defineRouteFactory } from "@src/templates/lib/api:route";

describe("createRouterRoutes", () => {
  describe("route middleware", () => {
    test("inserted after prioritized middleware", () => {
      function preMiddleware() {}
      function postMiddleware() {}
      function get() {}
      function post() {}

      const [getStack, postStack] = middlewareStackBuilder(
        [
          {
            definitionItems: defineRouteFactory(({ use, GET, POST }) => [
              use(preMiddleware),
              GET(get),
              POST(post),
              use(postMiddleware),
            ]),
          },
        ],
        {},
      );

      expect(getStack.methods).toEqual(["GET"]);
      expect(getStack.middleware[2]).toEqual(preMiddleware);
      expect(getStack.middleware[3]).toEqual(postMiddleware);
      expect(getStack.middleware[4]).toEqual(get);
      expect(getStack.middleware.length).toEqual(5);

      expect(postStack.methods).toEqual(["POST"]);
      expect(postStack.middleware[2]).toEqual(preMiddleware);
      expect(postStack.middleware[3]).toEqual(postMiddleware);
      expect(postStack.middleware[4]).toEqual(post);
      expect(postStack.middleware.length).toEqual(5);
    });

    it("overrides prioritized slots", () => {
      async function validateParams() {}
      async function validateBody() {}
      async function validateResponse() {}
      async function get() {}

      const [stack] = middlewareStackBuilder(
        [
          {
            definitionItems: defineRouteFactory(({ use, GET }) => [
              use(validateBody, { slot: "validate:json" }),
              use(validateParams, { slot: "validate:params" }),
              use(validateResponse, { slot: "validate:response" }),
              GET(get),
            ]),
          },
        ],
        {
          globalMiddleware: [
            use(async () => {}, { slot: "validate:json" }),
            use(async () => {}, { slot: "validate:params" }),
            use(async () => {}, { slot: "validate:response" }),
          ],
        },
      );

      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(validateBody);
      expect(stack.middleware[3]).toEqual(validateResponse);
      expect(stack.middleware[4]).toEqual(get);

      expect(stack.middleware.length).toEqual(5);
    });
  });
});
