import { describe, expect, test } from "vitest";

import { pathTokensFactory } from "@kosmojs/dev";

import { pathFactory } from "../src/base";

const createPathPattern = (path: string) => {
  return pathFactory(pathTokensFactory(path)[0]);
};

describe("pathFactory", () => {
  test("no params", () => {
    expect(createPathPattern("some/page")).toEqual("some/page");
  });

  test("no params with extension", () => {
    expect(createPathPattern("some/page.html")).toEqual("some/page.html");
  });

  test("required params", () => {
    expect(createPathPattern("some/:param")).toEqual("some/:param");
  });

  test("optional params", () => {
    expect(createPathPattern("some/{:param}")).toEqual("some/:param?");
  });

  test("splat params", () => {
    expect(createPathPattern("some/{...param}")).toEqual("some/*param");
  });

  test("combined params", () => {
    expect(createPathPattern("some/:required/with/{...rest}")).toEqual(
      "some/:required/with/*rest",
    );
  });

  test("index prefix replaced with /", () => {
    expect(createPathPattern("index")).toEqual("");
    expect(createPathPattern("index/:id")).toEqual(":id");
  });
});
