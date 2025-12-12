import { describe, expect, it } from "vitest";

import { defineRoute } from "@/router";
import { use } from "@/use";

import { defaultMethods, middlewareStackBuilder } from "..";

describe("routerRoutesFactory", () => {
  describe("useWrappers", () => {
    it("overrides core middleware", () => {
      async function paramsHandler() {}
      async function validateParams() {}
      async function payloadHandler() {}
      async function validatePayload() {}
      async function validateResponse() {}

      const stack = middlewareStackBuilder(
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

      expect(stack[0].kind).toEqual("middleware");
      expect(stack[0].middleware[0]).toEqual(paramsHandler);
      expect(stack.filter((e) => e.slot === "params").length).toEqual(1);

      expect(stack[1].kind).toEqual("middleware");
      expect(stack[1].middleware[0]).toEqual(validateParams);
      expect(stack.filter((e) => e.slot === "validateParams").length).toEqual(
        1,
      );

      expect(stack[2].kind).toEqual("middleware");
      expect(stack[2].middleware[0]).toEqual(payloadHandler);
      expect(stack.filter((e) => e.slot === "payload").length).toEqual(1);

      expect(stack[3].kind).toEqual("middleware");
      expect(stack[3].middleware[0]).toEqual(validatePayload);
      expect(stack.filter((e) => e.slot === "validatePayload").length).toEqual(
        1,
      );
      expect(stack[4].kind).toEqual("middleware");
      expect(stack[4].middleware[0]).toEqual(validateResponse);
      expect(stack.filter((e) => e.slot === "validateResponse").length).toEqual(
        1,
      );

      expect(stack.length).toEqual(5);
    });

    it("is overriden by route middleware", () => {
      async function paramsHandler() {}
      async function validateParams() {}
      async function payloadHandler() {}
      async function validatePayload() {}
      async function validateResponse() {}

      const stack = middlewareStackBuilder(
        [
          {
            useWrappers: [
              use(() => {}, { slot: "validatePayload" }),
              use(() => {}, { slot: "payload" }),
              use(() => {}, { slot: "validateParams" }),
              use(() => {}, { slot: "validateResponse" }),
              use(() => {}, { slot: "params" }),
            ],
            definitionItems: defineRoute(({ use }) => [
              use(validatePayload, { slot: "validatePayload" }),
              use(payloadHandler, { slot: "payload" }),
              use(validateParams, { slot: "validateParams" }),
              use(validateResponse, { slot: "validateResponse" }),
              use(paramsHandler, { slot: "params" }),
            ]),
          },
        ],
        {},
      );

      expect(stack[0].kind).toEqual("middleware");
      expect(stack[0].methods).toEqual(defaultMethods);
      expect(stack[0].middleware[0]).toEqual(paramsHandler);
      expect(stack.filter((e) => e.slot === "params").length).toEqual(1);

      expect(stack[1].kind).toEqual("middleware");
      expect(stack[1].methods).toEqual(defaultMethods);
      expect(stack[1].middleware[0]).toEqual(validateParams);
      expect(stack.filter((e) => e.slot === "validateParams").length).toEqual(
        1,
      );

      expect(stack[2].kind).toEqual("middleware");
      expect(stack[2].methods).toEqual(defaultMethods);
      expect(stack[2].middleware[0]).toEqual(payloadHandler);
      expect(stack.filter((e) => e.slot === "payload").length).toEqual(1);

      expect(stack[3].kind).toEqual("middleware");
      expect(stack[3].methods).toEqual(defaultMethods);
      expect(stack[3].middleware[0]).toEqual(validatePayload);
      expect(stack.filter((e) => e.slot === "validatePayload").length).toEqual(
        1,
      );
      expect(stack[4].kind).toEqual("middleware");
      expect(stack[4].methods).toEqual(defaultMethods);
      expect(stack[4].middleware[0]).toEqual(validateResponse);
      expect(stack.filter((e) => e.slot === "validateResponse").length).toEqual(
        1,
      );

      expect(stack.length).toEqual(5);
    });
  });
});
