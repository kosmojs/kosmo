import { describe, expect, it, test } from "vitest";

import { defineRoute } from "@/router";
import { use } from "@/use";

import { middlewareStackBuilder } from "..";

describe("createRouterRoutes", () => {
  describe("route middleware", () => {
    test("route middleware inserted after prioritized middleware", () => {
      function preMiddleware() {}
      function postMiddleware() {}
      function get() {}
      function post() {}

      const stack = middlewareStackBuilder(
        [
          {
            definitionItems: defineRoute(({ use, GET, POST }) => [
              use(preMiddleware),
              GET(get),
              POST(post),
              use(postMiddleware),
            ]),
          },
        ],
        {},
      );

      expect(stack[0].methods).toEqual(["GET"]);
      expect(stack[0].middleware[0].name).toEqual("useParams");
      expect(stack[0].middleware[1].name).toEqual("useValidateParams");
      expect(stack[0].middleware[2]).toEqual(preMiddleware);
      expect(stack[0].middleware[3]).toEqual(postMiddleware);
      expect(stack[0].middleware[4]).toEqual(get);
      expect(stack[0].middleware.length).toEqual(5);

      expect(stack[1].methods).toEqual(["POST"]);
      expect(stack[0].middleware[0].name).toEqual("useParams");
      expect(stack[0].middleware[1].name).toEqual("useValidateParams");
      expect(stack[1].middleware[2]).toEqual(preMiddleware);
      expect(stack[1].middleware[3]).toEqual(postMiddleware);
      expect(stack[1].middleware[4]).toEqual(post);
      expect(stack[1].middleware.length).toEqual(5);
    });

    it("overrides prioritized slots", () => {
      async function paramsHandler() {}
      async function validateParams() {}
      async function payloadHandler() {}
      async function validatePayload() {}
      async function validateResponse() {}
      async function get() {}

      const [stack] = middlewareStackBuilder(
        [
          {
            definitionItems: defineRoute(({ use, GET }) => [
              use(validatePayload, { slot: "validatePayload" }),
              use(payloadHandler, { slot: "payload" }),
              use(validateParams, { slot: "validateParams" }),
              use(validateResponse, { slot: "validateResponse" }),
              use(paramsHandler, { slot: "params" }),
              GET(get),
            ]),
          },
        ],
        {
          coreMiddleware: [
            use(async () => {}, { slot: "validatePayload" }),
            use(async () => {}, { slot: "payload" }),
            use(async () => {}, { slot: "validateParams" }),
            use(async () => {}, { slot: "validateResponse" }),
            use(async () => {}, { slot: "params" }),
          ],
        },
      );

      expect(stack.middleware[0]).toEqual(paramsHandler);
      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(payloadHandler);
      expect(stack.middleware[3]).toEqual(validatePayload);
      expect(stack.middleware[4]).toEqual(validateResponse);
      expect(stack.middleware[5]).toEqual(get);

      expect(stack.middleware.length).toEqual(6);
    });
  });
});
