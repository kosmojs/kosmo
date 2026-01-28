import { describe, expect, test } from "vitest";

import {
  type HTTPMethod,
  HTTPMethods,
  type MiddlewareDefinition,
} from "@kosmojs/api";

import type { ParameterizedMiddleware } from "@/templates/lib/api";
import { defineRouteFactory } from "@/templates/lib/api:route";

describe("defineRoute", () => {
  describe("use", () => {
    test("accepts single middleware", () => {
      async function mw() {}
      const [stack] = defineRouteFactory(({ use }) => [use(mw)]) as Array<
        MiddlewareDefinition<ParameterizedMiddleware>
      >;
      expect(stack.kind).toEqual("middleware");
      expect(stack.middleware[0]).toEqual(mw);
      expect(stack.middleware.length).toEqual(1);
      expect(stack.options).toBeUndefined();
    });

    test("accepts middleware array", () => {
      async function mw1() {}
      async function mw2() {}
      const [stack] = defineRouteFactory(({ use }) => [
        use([mw1, mw2]),
      ]) as Array<MiddlewareDefinition<ParameterizedMiddleware>>;
      expect(stack.kind).toEqual("middleware");
      expect(stack.middleware[0]).toEqual(mw1);
      expect(stack.middleware[1]).toEqual(mw2);
      expect(stack.middleware.length).toEqual(2);
      expect(stack.options).toBeUndefined();
    });

    test("accepts slot option", () => {
      const [stack] = defineRouteFactory(({ use }) => [
        use(async () => {}, { slot: "payload" }),
      ]) as Array<MiddlewareDefinition<ParameterizedMiddleware>>;
      expect(stack.options?.slot).toEqual("payload");
    });

    test("accepts `on` option", () => {
      const [stack] = defineRouteFactory(({ use }) => [
        use(async () => {}, { on: ["GET"] }),
      ]) as Array<MiddlewareDefinition<ParameterizedMiddleware>>;
      expect(stack.options?.on).toEqual(["GET"]);
    });
  });

  for (const method of Object.keys(HTTPMethods) as Array<HTTPMethod>) {
    test(`${method}: accepts single middleware`, () => {
      async function handler() {}
      const [stack] = defineRouteFactory((map) => [
        map[method](handler),
      ]) as Array<MiddlewareDefinition<ParameterizedMiddleware>>;
      expect(stack.kind).toEqual("handler");
      expect(stack.middleware[0]).toEqual(handler);
      expect(stack.middleware.length).toEqual(1);
    });

    test(`${method}: accepts middleware array`, () => {
      async function handler1() {}
      async function handler2() {}
      const [stack] = defineRouteFactory((map) => [
        map[method]([handler1, handler2]),
      ]) as Array<MiddlewareDefinition<ParameterizedMiddleware>>;
      expect(stack.kind).toEqual("handler");
      expect(stack.middleware[0]).toEqual(handler1);
      expect(stack.middleware[1]).toEqual(handler2);
      expect(stack.middleware.length).toEqual(2);
    });
  }
});
