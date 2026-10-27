import { describe, expect, test } from "vitest";

import {
  baseWeight,
  compileAliasPatterns,
  createDispatcher,
  matchBase,
  sortByBase,
} from "../src/dispatch";

describe("matchBase", () => {
  test("matches the base itself", () => {
    expect(matchBase("/admin", "/admin")).toBe(true);
  });

  test("matches paths below the base", () => {
    expect(matchBase("/admin", "/admin/users")).toBe(true);
  });

  test("does not match a sibling that shares the prefix", () => {
    expect(matchBase("/admin", "/administer")).toBe(false);
  });

  test("root base matches every path", () => {
    expect(matchBase("/", "/")).toBe(true);
    expect(matchBase("/", "/about")).toBe(true);
    expect(matchBase("/", "/a/b/c")).toBe(true);
  });

  test("base with a trailing slash", () => {
    expect(matchBase("/admin/", "/admin/users")).toBe(true);
  });
});

describe("sortByBase", () => {
  test("nested bases come before the bases they are nested in", () => {
    const sorted = sortByBase(
      ["/", "/api", "/admin", "/admin/api"],
      (base) => base,
    );
    expect(sorted).toEqual(["/admin/api", "/admin", "/api", "/"]);
  });

  test("does not mutate the input", () => {
    const input = ["/", "/api"];
    sortByBase(input, (base) => base);
    expect(input).toEqual(["/", "/api"]);
  });

  test("weight grows with length and depth", () => {
    expect(baseWeight("/")).toBe(1);
    expect(baseWeight("/api")).toBe(5);
    expect(baseWeight("/admin/api")).toBe(12);
  });
});

describe("compileAliasPatterns", () => {
  test("adds the leading slash and compiles params", () => {
    const [pattern] = compileAliasPatterns(["members/:id"]);
    expect(pattern?.test("/members/42")).toBe(true);
    expect(pattern?.test("/members")).toBe(false);
  });

  test("keeps an existing leading slash", () => {
    const [pattern] = compileAliasPatterns(["/feed.xml"]);
    expect(pattern?.test("/feed.xml")).toBe(true);
  });

  test("handles a missing list", () => {
    expect(compileAliasPatterns(undefined)).toEqual([]);
  });
});

describe("createDispatcher", () => {
  test("longest base wins", () => {
    const dispatch = createDispatcher([
      { base: "/", target: "app" },
      { base: "/admin", target: "admin" },
      { base: "/admin/api", target: "admin-api" },
    ]);
    expect(dispatch("/")).toBe("app");
    expect(dispatch("/about")).toBe("app");
    expect(dispatch("/admin")).toBe("admin");
    expect(dispatch("/admin/users")).toBe("admin");
    expect(dispatch("/admin/api/users")).toBe("admin-api");
  });

  test("order of entries does not matter", () => {
    const dispatch = createDispatcher([
      { base: "/admin/api", target: "admin-api" },
      { base: "/", target: "app" },
      { base: "/admin", target: "admin" },
    ]);
    expect(dispatch("/admin/api/users")).toBe("admin-api");
    expect(dispatch("/admin/users")).toBe("admin");
    expect(dispatch("/x")).toBe("app");
  });

  test("returns undefined when nothing matches", () => {
    const dispatch = createDispatcher([{ base: "/admin", target: "admin" }]);
    expect(dispatch("/about")).toBeUndefined();
  });

  test("an alias outside the backend base reaches the backend", () => {
    const dispatch = createDispatcher([
      { base: "/", target: "pages" },
      {
        base: "/api",
        aliasPatterns: compileAliasPatterns(["/feed.xml"]),
        target: "api",
      },
    ]);
    expect(dispatch("/feed.xml")).toBe("api");
    expect(dispatch("/about")).toBe("pages");
  });

  test("an alias wins over its own folder's longer frontend base", () => {
    const dispatch = createDispatcher([
      { base: "/shop", target: "pages" },
      {
        base: "/api",
        aliasPatterns: compileAliasPatterns(["/shop/feed.xml"]),
        target: "api",
      },
    ]);
    expect(dispatch("/shop/feed.xml")).toBe("api");
    expect(dispatch("/shop/cart")).toBe("pages");
  });

  test("an alias wins over another folder's longer base", () => {
    const dispatch = createDispatcher([
      { base: "/docs", target: "docs" },
      {
        base: "/api",
        aliasPatterns: compileAliasPatterns(["/docs/feed.xml"]),
        target: "api",
      },
    ]);
    expect(dispatch("/docs/feed.xml")).toBe("api");
    expect(dispatch("/docs/intro")).toBe("docs");
  });
});
