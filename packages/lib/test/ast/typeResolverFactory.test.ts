import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { defaults, type ResolvedTypeSignature } from "@kosmojs/core";
import { astFactory } from "@kosmojs/lib";

import { sourceFolder } from "../routes";

const { refineTypeName } = defaults;

describe("typeResolverFactory", { timeout: 10_000 }, () => {
  const { typeResolverFactory } = astFactory();

  const {
    //
    getSourceFile,
    literalTypesResolver,
  } = typeResolverFactory(sourceFolder);

  // The resolver preserves VRefine (self-override) so refinements survive flattening
  const resolveLiterals = (literalTypes: string) => {
    return literalTypesResolver(literalTypes, {
      overrides: { [refineTypeName]: refineTypeName },
      withProperties: true,
    });
  };

  const numericOf = (
    types: Array<ResolvedTypeSignature>,
    name: string,
  ): Array<string> => {
    const type = types.find((e) => e.name === name);

    if (!type) {
      throw new Error(`${name} type not found`);
    }

    if (!type.numericProperties) {
      throw new Error(`${name} type has no numericProperties`);
    }

    return type.numericProperties;
  };

  const booleanOf = (
    types: Array<ResolvedTypeSignature>,
    name: string,
  ): Array<string> => {
    const type = types.find((e) => e.name === name);

    if (!type) {
      throw new Error(`${name} type not found`);
    }

    if (!type.booleanProperties) {
      throw new Error(`${name} type has no booleanProperties`);
    }

    return type.booleanProperties;
  };

  // tfusion reformats flattened type text, so schemas carry non-semantic whitespace;
  // compare on collapsed whitespace.
  const compact = (text: string | undefined) => {
    return text?.replace(/\s+/g, " ").trim();
  };

  describe("literalTypesResolver", () => {
    test("renders typebox schema, preserving VRefine as infix with", () => {
      const [resolved] = resolveLiterals(
        `export type query = { id: VRefine<number, { minimum: 1 }> };`,
      );
      expect(compact(resolved?.typeboxSchema)).toBe(
        "{ id: (number with { minimum: 1 }) }",
      );
    });

    test("resolves per-property typebox schema", () => {
      const [resolved] = resolveLiterals(
        `export type query = { a: number; b: VRefine<string, { format: "email" }> };`,
      );
      expect(
        resolved?.properties?.map((p) => compact(p.typeboxSchema)),
      ).toEqual(["number", `(string with { format: "email" })`]);
    });

    describe("numericProperties", () => {
      test("detects bare number", () => {
        const types = resolveLiterals(`export type query = { a: number };`);
        expect(numericOf(types, "query")).toEqual(["a"]);
      });

      test("detects VRefine-wrapped number", () => {
        const types = resolveLiterals(
          `export type query = { a: VRefine<number, { minimum: 1 }> };`,
        );
        expect(numericOf(types, "query")).toEqual(["a"]);
      });

      test("detects array-wrapped number", () => {
        const types = resolveLiterals(
          `export type query = { a: Array<number>; b: number[]; c: readonly number[] };`,
        );
        expect(numericOf(types, "query")).toEqual(["a", "b", "c"]);
      });

      test("detects number through a local alias", () => {
        const types = resolveLiterals(
          `type NumberT = number; export type query = { a: NumberT };`,
        );
        expect(numericOf(types, "query")).toEqual(["a"]);
      });

      test("detects number through a refined alias", () => {
        const types = resolveLiterals(
          `
            type VInteger = VRefine<number, { minimum: 1; multipleOf: 1 }>;
            export type query = { a: VInteger };
          `,
        );
        expect(numericOf(types, "query")).toEqual(["a"]);
      });

      test("empty array when object literal has no numeric elements", () => {
        const types = resolveLiterals(
          `export type query = { a: string; b: "x" | "y"; c: boolean };`,
        );
        expect(numericOf(types, "query")).toEqual([]);
      });

      test("detects numeric literals, sign included", () => {
        const types = resolveLiterals(`export type query = { a: 2; b: -2 };`);
        expect(numericOf(types, "query")).toEqual(["a", "b"]);
      });

      test("detects unions where every member is numeric", () => {
        const types = resolveLiterals(
          `export type query = { a: 1 | 2 | 3; b: 1 | -2 | 3 };`,
        );
        expect(numericOf(types, "query")).toEqual(["a", "b"]);
      });

      test("rejects mixed unions", () => {
        const types = resolveLiterals(
          `export type query = { a: 1 | "x"; b: string | number };`,
        );
        expect(numericOf(types, "query")).toEqual([]);
      });

      test("keys ParamsT numeric properties by name", () => {
        const types = resolveLiterals(
          `export type ParamsT = { "id": VRefine<number, { minimum: 1 }>; "slug": string };`,
        );
        expect(numericOf(types, "ParamsT")).toEqual(["id"]);
      });
    });

    describe("booleanProperties", () => {
      test("detects bare boolean", () => {
        const types = resolveLiterals(`export type query = { a: boolean };`);
        expect(booleanOf(types, "query")).toEqual(["a"]);
      });

      test("detects array-wrapped booleans", () => {
        const types = resolveLiterals(
          `export type query = { a: Array<boolean>; b: boolean[]; c: readonly boolean[] };`,
        );
        expect(booleanOf(types, "query")).toEqual(["a", "b", "c"]);
      });

      test("detects literal true / false", () => {
        const types = resolveLiterals(
          `export type query = { a: true; b: false };`,
        );
        expect(booleanOf(types, "query")).toEqual(["a", "b"]);
      });

      test("detects boolean through a local alias", () => {
        const types = resolveLiterals(
          `type FlagT = boolean; export type query = { a: FlagT };`,
        );
        expect(booleanOf(types, "query")).toEqual(["a"]);
      });

      test("empty array when object literal has no boolean elements", () => {
        const types = resolveLiterals(
          `export type query = { a: string; b: "x" | "y"; c: number };`,
        );
        expect(booleanOf(types, "query")).toEqual([]);
      });
    });
  });

  describe("getSourceFile", () => {
    test("caches and returns the same instance per path", () => {
      const fileFullpath = resolve(
        import.meta.dirname,
        "../@fixtures/ast/extractTypeDeclarations/imports/with-referenced-files.ts",
      );
      const first = getSourceFile(fileFullpath);
      const second = getSourceFile(fileFullpath);
      expect(first).toBe(second);
      expect(first.getFilePath()).toBe(fileFullpath);
    });
  });
});
