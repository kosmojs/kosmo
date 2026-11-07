import { describe, expect, test } from "vitest";

import { importSchema, MESSAGE_CODES } from ".";

// json and form payloads and responses reject properties the schema does not
// declare, at every depth; query, headers, cookies and params stay open
describe("closed objects", () => {
  describe("json", async () => {
    const schema = await importSchema("closed/json", "json.POST");

    const valid = {
      plain: { a: "x" },
      nested: { inner: { x: 1 } },
      list: [{ id: 1 }, { id: 2 }],
      tuple: [{ a: "x" }, 1],
      merged: { id: 1, name: "n", tag: "t" },
      partial: { city: "c" },
      omitted: { street: "s", city: "c" },
      meta: { k: { v: "v" } },
      reopened: { a: "x", extra: true },
      reopenedMember: { id: 1, b: "b", extra: true },
      maybe: { c: true },
    };

    const codeOf = (data: unknown) => {
      return schema?.errors(data).map((e) => e.code);
    };

    test("accepts every declared property", () => {
      expect(schema?.check(valid), JSON.stringify(schema?.errors(valid))).toBe(
        true,
      );
    });

    test("accepts the other member of a union inside an intersection", () => {
      const data = { ...valid, merged: { id: 1, title: "t" } };
      expect(schema?.check(data)).toBe(true);
    });

    test("accepts null where a closed object is nullable", () => {
      expect(schema?.check({ ...valid, maybe: null })).toBe(true);
    });

    for (const [name, data, code] of [
      [
        "a top-level extra property",
        { ...valid, role: "admin" },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "an extra property in a nested object",
        { ...valid, nested: { inner: { x: 1, y: 2 } } },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "an extra property in an array element",
        { ...valid, list: [{ id: 1, admin: true }] },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "an extra property in a tuple element",
        { ...valid, tuple: [{ a: "x", b: 1 }, 1] },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "an extra property in an intersection",
        { ...valid, merged: { id: 1, name: "n", role: "admin" } },
        MESSAGE_CODES.OBJECT_UNEVALUATED_PROPERTIES,
      ],
      [
        "a property of the other union member in an intersection",
        { ...valid, merged: { id: 1, name: "n", title: "t", x: 1 } },
        MESSAGE_CODES.OBJECT_UNEVALUATED_PROPERTIES,
      ],
      [
        "an extra property in a Partial",
        { ...valid, partial: { city: "c", zip: "z" } },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "the omitted property of an Omit",
        { ...valid, omitted: { street: "s", city: "c", zip: "z" } },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
      [
        "an extra property in a record value",
        { ...valid, meta: { k: { v: "v", w: "w" } } },
        MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
      ],
    ] as const) {
      test(`rejects ${name}`, () => {
        expect(schema?.check(data)).toBe(false);
        expect(codeOf(data)).toContain(code);
      });
    }

    // a union reports the failure of its branches, not the extra property itself
    test("rejects an extra property in a nullable object", () => {
      expect(schema?.check({ ...valid, maybe: { c: true, d: false } })).toBe(
        false,
      );
    });

    test("a record keeps any key", () => {
      const data = { ...valid, meta: { a: { v: "1" }, b: { v: "2" } } };
      expect(schema?.check(data)).toBe(true);
    });

    test("names the extra property in the message", () => {
      const data = { ...valid, role: "admin" };
      expect(schema?.errorMessage(data)).toMatch(/role/);
    });
  });

  describe("json, an intersection at the top", async () => {
    const schema = await importSchema("closed/intersection", "json.POST");

    test("accepts the properties of every constituent", () => {
      expect(schema?.check({ id: 1, extra: "e" })).toBe(true);
    });

    test("rejects an undeclared property", () => {
      const data = { id: 1, extra: "e", role: "admin" };
      expect(schema?.check(data)).toBe(false);
      expect(schema?.errors(data).map((e) => e.code)).toContain(
        MESSAGE_CODES.OBJECT_UNEVALUATED_PROPERTIES,
      );
    });
  });

  describe("form", async () => {
    const schema = await importSchema("closed/form", "form.POST");

    test("accepts the declared fields", () => {
      expect(schema?.check({ title: "t", tags: ["a"] })).toBe(true);
    });

    test("rejects an undeclared field", () => {
      expect(schema?.check({ title: "t", role: "admin" })).toBe(false);
    });
  });

  describe("response", async () => {
    const schema = await importSchema("closed/response", "response.GET");

    test("accepts the declared shape", () => {
      expect(schema?.check({ id: 1, profile: { name: "n" } })).toBe(true);
    });

    // a row returned as-is carries columns the response never declared
    test("rejects an undeclared property, at the top and nested", () => {
      for (const data of [
        { id: 1, profile: { name: "n" }, passwordHash: "x" },
        { id: 1, profile: { name: "n", email: "e" } },
      ]) {
        expect(schema?.check(data), JSON.stringify(data)).toBe(false);
        expect(schema?.errors(data).map((e) => e.code)).toContain(
          MESSAGE_CODES.OBJECT_ADDITIONAL_PROPERTIES,
        );
      }
    });
  });

  describe("query stays open", async () => {
    const schema = await importSchema("closed/json", "query.POST");

    test("accepts undeclared parameters, at the top and nested", () => {
      expect(
        schema?.check({ page: 1, utm: "x", filter: { q: "q", sort: "s" } }),
      ).toBe(true);
    });
  });

  describe("params stay open", async () => {
    const schema = await importSchema("closed/json", "params");

    test("accept an empty params object", () => {
      expect(schema?.check({})).toBe(true);
    });
  });
});
