import { describe, expect, it } from "vitest";

import { middlewareStackBuilder } from "..";

import { use } from "@src/templates/lib/api";
import { defineRouteFactory } from "@src/templates/lib/api:route";

describe("createRouterRoutes", () => {
  async function paramsHandler() {}
  async function validateParams() {}
  async function payloadHandler() {}
  async function validatePayload() {}
  async function validateResponse() {}

  describe("useWrappers", () => {
    it("overrides global middleware", () => {
      const [stack] = middlewareStackBuilder(
        [
          {
            useWrappers: [
              use(validatePayload, { slot: "validatePayload" }),
              use(payloadHandler, { slot: "payload" }),
              use(validateParams, { slot: "validateParams" }),
              use(validateResponse, { slot: "validateResponse" }),
              use(paramsHandler, { slot: "params" }),
            ],
          },
        ],
        {},
      );

      expect(stack.middleware[0]).toEqual(paramsHandler);
      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(payloadHandler);
      expect(stack.middleware[3]).toEqual(validatePayload);
      expect(stack.middleware[4]).toEqual(validateResponse);

      expect(stack.middleware.length).toEqual(6);
    });

    it("is overridden by route middleware", () => {
      const [stack] = middlewareStackBuilder(
        [
          {
            definitionItems: defineRouteFactory(({ use, GET }) => [
              use(validatePayload, { slot: "validatePayload" }),
              use(payloadHandler, { slot: "payload" }),
              use(validateParams, { slot: "validateParams" }),
              use(validateResponse, { slot: "validateResponse" }),
              use(paramsHandler, { slot: "params" }),
              GET(async function get() {}),
            ]),
          },
        ],
        {
          globalMiddleware: [
            use(() => {}, { slot: "validatePayload" }),
            use(() => {}, { slot: "payload" }),
            use(() => {}, { slot: "validateParams" }),
            use(() => {}, { slot: "validateResponse" }),
            use(() => {}, { slot: "params" }),
          ],
        },
      );

      expect(stack.middleware[0]).toEqual(paramsHandler);
      expect(stack.middleware[1]).toEqual(validateParams);
      expect(stack.middleware[2]).toEqual(payloadHandler);
      expect(stack.middleware[3]).toEqual(validatePayload);
      expect(stack.middleware[4]).toEqual(validateResponse);

      expect(stack.middleware.length).toEqual(6);
    });
  });
});
