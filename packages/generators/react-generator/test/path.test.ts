import { describe, expect, test } from "vitest";

import { pathTokensFactory } from "@kosmojs/lib";

import { pathFactory } from "../src/base";

const createPathPattern = (path: string) => {
  const pathTokens = pathTokensFactory(path);
  return pathFactory(pathTokens);
};

describe("pathFactory", () => {
  test("no params", () => {
    expect(createPathPattern("some/page")).toEqual("some/page");
  });

  test("no params with extension", () => {
    expect(createPathPattern("some/page.html")).toEqual("some/page.html");
  });

  test("required params", () => {
    expect(createPathPattern("some/[param]")).toEqual("some/:param");
  });

  test("optional params", () => {
    expect(createPathPattern("some/{param}")).toEqual("some/:param?");
  });

  test("splat params", () => {
    expect(createPathPattern("some/{...param}")).toEqual("some/*");
  });

  test("combined params", () => {
    expect(createPathPattern("some/[required]/with/{...rest}")).toEqual(
      "some/:required/with/*",
    );
  });

  test("index prefix replaced with /", () => {
    expect(createPathPattern("index")).toEqual("");
    expect(createPathPattern("index/[id]")).toEqual(":id");
  });
});
