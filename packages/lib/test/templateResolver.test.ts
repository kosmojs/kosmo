import { describe, expect, test } from "vitest";

import type { ResolvedEntry } from "@kosmojs/core";
import { createTemplateResolver } from "@kosmojs/lib";

const entryOf = (kind: ResolvedEntry["kind"], name: string) => {
  return { kind, entry: { name } } as ResolvedEntry;
};

describe("createTemplateResolver", () => {
  test("a string template seeds routes only", () => {
    const resolve = createTemplateResolver({ "admin/**": "custom" });
    for (const kind of ["pageRoute", "apiRoute"] as const) {
      expect(resolve("admin/users", entryOf(kind, "admin/users"))).toEqual({
        [kind]: "custom",
      });
    }
    for (const kind of ["pageLayout", "apiUse"] as const) {
      expect(resolve("admin/users", entryOf(kind, "admin/users"))).toEqual({
        [kind]: undefined,
      });
    }
  });

  test("a function template is called for every kind with the resolved entry", () => {
    const resolve = createTemplateResolver({
      "admin/**": ({ kind, entry }) => `${kind}:${entry.name}`,
    });
    for (const kind of [
      "pageRoute",
      "pageLayout",
      "apiRoute",
      "apiUse",
    ] as const) {
      expect(resolve("admin/users", entryOf(kind, "admin/users"))).toEqual({
        [kind]: `${kind}:admin/users`,
      });
    }
  });

  test("a function returning undefined keeps the built-in template", () => {
    const resolve = createTemplateResolver({ "admin/**": () => undefined });
    expect(resolve("admin/users", entryOf("pageRoute", "admin/users"))).toEqual(
      {
        pageRoute: undefined,
      },
    );
  });

  test("a name matching no pattern keeps the built-in template", () => {
    const resolve = createTemplateResolver({ "admin/**": "custom" });
    expect(
      resolve("products/list", entryOf("pageRoute", "products/list")),
    ).toEqual({
      pageRoute: undefined,
    });
  });

  test("the first matching pattern wins", () => {
    const resolve = createTemplateResolver({
      "admin/users": "specific",
      "admin/**": "generic",
    });
    expect(resolve("admin/users", entryOf("pageRoute", "admin/users"))).toEqual(
      {
        pageRoute: "specific",
      },
    );
    expect(resolve("admin/roles", entryOf("pageRoute", "admin/roles"))).toEqual(
      {
        pageRoute: "generic",
      },
    );
  });
});
