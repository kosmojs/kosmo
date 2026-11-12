import { resolve } from "node:path";

import Type from "typebox";
import { Compile } from "typebox/compile";
import { describe, expect, test, vi } from "vitest";

import type { JsonSchema, ResolvedTypeSignature } from "@kosmojs/core";
import { astFactory } from "@kosmojs/lib";

import { project, sourceFolder } from "..";

describe("typeResolver", { timeout: 10_000 }, () => {
  const { resolveTypes } = astFactory().typeResolverFactory(
    project,
    sourceFolder,
  );

  // a route's types file sits in lib; its imports use the project aliases
  const entryFile = resolve(project.root, "var/lib/test/api/probe/types.ts");

  const resolveSource = (
    source: string,
    opts?: { names?: Array<string>; closedTypes?: Array<string> },
  ) => {
    const names = opts?.names ?? ["json"];
    return resolveTypes(
      { file: entryFile, source, route: "probe" },
      { names, closedTypes: opts?.closedTypes ?? [] },
    );
  };

  const typeOf = (
    source: string,
    opts?: { name?: string; closed?: boolean },
  ): ResolvedTypeSignature => {
    const name = opts?.name ?? "json";
    const { resolvedTypes } = resolveSource(source, {
      names: [name],
      closedTypes: opts?.closed ? [name] : [],
    });
    const type = resolvedTypes?.find((e) => e.name === name);
    if (!type) {
      throw new Error(`${name} not resolved`);
    }
    return type;
  };

  // the custom types the runtime supplies, as Script context does
  const customTypes = {
    Date: Type.Unsafe({ instanceOf: "Date" }),
  };

  const checker = (schema: JsonSchema) => {
    const resolveRefs = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(resolveRefs);
      if (!node || typeof node !== "object") return node;
      const ref = (node as JsonSchema).$ref;
      if (typeof ref === "string" && ref in customTypes) {
        return customTypes[ref as keyof typeof customTypes];
      }
      return Object.fromEntries(
        Object.entries(node).map(([k, v]) => [k, resolveRefs(v)]),
      );
    };
    const compiled = Compile(resolveRefs(schema) as never);
    return (data: unknown) => compiled.Check(data);
  };

  const check = (source: string, opts?: { closed?: boolean }) => {
    return checker(typeOf(source, opts).jsonSchema);
  };

  describe("VRefine", () => {
    test("applies its options to the refined type", () => {
      const valid = check(
        `export type json = { email: VRefine<string, { format: "email" }> };`,
      );
      expect(valid({ email: "a@b.co" })).toBe(true);
      expect(valid({ email: "nope" })).toBe(false);
    });

    test("applies to the whole of a refined union", () => {
      const { jsonSchema } = typeOf(
        `export type json = { a: VRefine<"x" | "y", { description: "d" }> };`,
      );
      const a = (jsonSchema.properties as Record<string, JsonSchema>).a;
      expect(a?.description).toBe("d");
      expect(a?.anyOf).toHaveLength(2);
    });

    test("applies inside an array element and an index signature value", () => {
      const valid = check(
        `export type json = { tags: VRefine<string, { minLength: 2 }>[]; meta: { [k: string]: VRefine<string, { minLength: 2 }> } };`,
      );
      expect(valid({ tags: ["ab"], meta: { k: "ab" } })).toBe(true);
      expect(valid({ tags: ["a"], meta: {} })).toBe(false);
      expect(valid({ tags: [], meta: { k: "a" } })).toBe(false);
    });

    test("keeps a regex escape as one backslash", () => {
      const valid = check(
        `export type json = { code: VRefine<string, { pattern: "^\\\\d+$" }> };`,
      );
      expect(valid({ code: "123" })).toBe(true);
      expect(valid({ code: "abc" })).toBe(false);
    });
  });

  describe("closed types", () => {
    test("leave every other type open", () => {
      const valid = check(`export type json = { a: { b: string } };`);
      expect(valid({ a: { b: "x", extra: 1 }, extra: 1 })).toBe(true);
    });

    test("close an object and every nested object", () => {
      const valid = check(`export type json = { a: { b: string } };`, {
        closed: true,
      });
      expect(valid({ a: { b: "x" } })).toBe(true);
      expect(valid({ a: { b: "x" }, extra: 1 })).toBe(false);
      expect(valid({ a: { b: "x", extra: 1 } })).toBe(false);
    });

    test("close array and tuple elements, and record values", () => {
      const valid = check(
        `export type json = { list: Array<{ id: number }>; pair: [{ a: string }, number]; meta: Record<string, { v: string }> };`,
        { closed: true },
      );
      const ok = {
        list: [{ id: 1 }],
        pair: [{ a: "x" }, 1],
        meta: { k: { v: "v" } },
      };
      expect(valid(ok)).toBe(true);
      expect(valid({ ...ok, list: [{ id: 1, x: 1 }] })).toBe(false);
      expect(valid({ ...ok, pair: [{ a: "x", x: 1 }, 1] })).toBe(false);
      expect(valid({ ...ok, meta: { k: { v: "v", x: 1 } } })).toBe(false);
      expect(valid({ ...ok, meta: { any: { v: "v" } } })).toBe(true);
    });

    test("close an intersection as a whole, leaving its constituents open", () => {
      const { jsonSchema } = typeOf(
        `export type json = { a: string } & ({ b: number } | { c: number });`,
        { closed: true },
      );
      expect(jsonSchema.unevaluatedProperties).toBe(false);
      const valid = checker(jsonSchema);
      expect(valid({ a: "x", b: 1 })).toBe(true);
      expect(valid({ a: "x", c: 1 })).toBe(true);
      expect(valid({ a: "x", b: 1, extra: 1 })).toBe(false);
    });

    test("still close the property types of an intersection constituent", () => {
      const valid = check(
        `export type json = { a: { x: string } } & { b: number };`,
        { closed: true },
      );
      expect(valid({ a: { x: "x" }, b: 1 })).toBe(true);
      expect(valid({ a: { x: "x", y: 1 }, b: 1 })).toBe(false);
    });

    test("close each union member on its own", () => {
      const valid = check(`export type json = { a: string } | { b: number };`, {
        closed: true,
      });
      expect(valid({ a: "x" })).toBe(true);
      expect(valid({ b: 1 })).toBe(true);
      expect(valid({ a: "x", b: 1 })).toBe(false);
    });

    test("reopen where a refinement says so", () => {
      const valid = check(
        `export type json = { meta: VRefine<{ source: string }, { additionalProperties: true }> };`,
        { closed: true },
      );
      expect(valid({ meta: { source: "s", any: 1 } })).toBe(true);
      expect(valid({ meta: { source: "s" }, extra: 1 })).toBe(false);
    });

    test("close what an object mapper produces", () => {
      const valid = check(
        `export type json = { p: Partial<{ a: string; b: number }>; o: Omit<{ a: string; b: number }, "b"> };`,
        { closed: true },
      );
      expect(valid({ p: { a: "x" }, o: { a: "x" } })).toBe(true);
      expect(valid({ p: { a: "x", z: 1 }, o: { a: "x" } })).toBe(false);
      expect(valid({ p: {}, o: { a: "x", b: 1 } })).toBe(false);
    });

    test("close a record with known keys and a mapped type", () => {
      const valid = check(
        `export type json = { r: Record<"a" | "b", number>; m: { [K in "x" | "y"]: string } };`,
        { closed: true },
      );
      expect(valid({ r: { a: 1, b: 2 }, m: { x: "1", y: "2" } })).toBe(true);
      expect(valid({ r: { a: 1, b: 2, c: 3 }, m: { x: "1", y: "2" } })).toBe(
        false,
      );
      expect(valid({ r: { a: 1, b: 2 }, m: { x: "1", y: "2", z: "3" } })).toBe(
        false,
      );
    });

    test("check properties mixed with an index signature against both", () => {
      const valid = check(
        `export type json = { counts: { total: number; [k: string]: number } };`,
        { closed: true },
      );
      expect(valid({ counts: { total: 1, a: 2 } })).toBe(true);
      expect(valid({ counts: { total: 1, a: "x" } })).toBe(false);
      expect(valid({ counts: { a: 2 } })).toBe(false);
    });

    test("close per-property schemas too", () => {
      const { properties } = typeOf(
        `export type json = { a: { b: string }; c: string };`,
        { closed: true },
      );
      expect(properties?.map((p) => p.name)).toEqual(["a", "c"]);
      expect(properties?.[0]?.jsonSchema.additionalProperties).toBe(false);
    });
  });

  describe("numericProperties", () => {
    const numericOf = (source: string, name = "json") => {
      return typeOf(source, { name }).numericProperties;
    };

    test("detect numbers, refined numbers, numeric arrays, literals and unions", () => {
      expect(
        numericOf(
          `export type json = { a: number; b: VRefine<number, { minimum: 1 }>; c: number[]; d: Array<VRefine<number, { minimum: 0 }>>; e: 1 | -2; f: number | string; g: string };`,
        ),
      ).toEqual(["a", "b", "c", "d", "e"]);
    });

    test("detect a number through aliases", () => {
      expect(
        numericOf(
          `type Id = number; type Page = VRefine<Id, { minimum: 1 }>; export type json = { id: Id; page?: Page };`,
        ),
      ).toEqual(["id", "page"]);
    });

    test("key params by name", () => {
      expect(
        numericOf(
          `export type ParamsT = { "id": number, "slug": string };`,
          "ParamsT",
        ),
      ).toEqual(["id"]);
    });
  });

  describe("booleanProperties", () => {
    test("detect booleans, refined booleans, boolean arrays and literals", () => {
      expect(
        typeOf(
          `type Flag = boolean; export type json = { a: boolean; b: true; c: boolean[]; d: VRefine<boolean[], { minItems: 1 }>; e: true | false; f: Flag; g: string };`,
        ).booleanProperties,
      ).toEqual(["a", "b", "c", "d", "e", "f"]);
    });
  });

  describe("discovery", () => {
    test("follows imports across files, through re-exports and aliases", () => {
      const { resolvedTypes, referencedFiles } = resolveSource(
        `import type { Page, User } from "@/types/discovery";\nexport type json = { users: Page<User> };`,
      );

      const files = referencedFiles.map((f) =>
        f.replace(`${project.root}/`, ""),
      );
      expect(files.sort()).toEqual([
        "types/discovery/base.ts",
        "types/discovery/index.ts",
        "types/discovery/user.ts",
      ]);

      const [json] = resolvedTypes ?? [];
      const valid = checker(json?.jsonSchema as JsonSchema);
      const user = {
        id: 1,
        createdAt: "2026-01-01T00:00:00Z",
        name: "n",
        status: "active",
        role: "member",
      };
      expect(valid({ users: { items: [user], total: 1 } })).toBe(true);
      expect(
        valid({ users: { items: [{ ...user, name: "" }], total: 1 } }),
      ).toBe(false);
      expect(
        valid({ users: { items: [{ ...user, status: "gone" }], total: 1 } }),
      ).toBe(false);
      expect(
        valid({ users: { items: [{ ...user, role: "root" }], total: 1 } }),
      ).toBe(false);
      expect(
        valid({ users: { items: [{ ...user, admin: "member" }], total: 1 } }),
      ).toBe(false);
      expect(
        valid({ users: { items: [{ ...user, admin: "admin" }], total: 1 } }),
      ).toBe(true);
    });

    test("follows a namespace import and a default export", () => {
      const { resolvedTypes } = resolveSource(
        `import type * as D from "@/types/discovery";\nimport type Settings from "@/types/discovery/default";\nexport type json = { user: D.User; settings: Settings };`,
      );
      const [json] = resolvedTypes ?? [];
      const props = json?.jsonSchema.properties as Record<string, JsonSchema>;
      expect(props.user?.type).toBe("object");
      expect(checker(props.settings as JsonSchema)({ theme: "dark" })).toBe(
        true,
      );
      expect(checker(props.settings as JsonSchema)({ theme: "blue" })).toBe(
        false,
      );
    });

    test("evaluates a recursive type at any depth", () => {
      const { resolvedTypes } = resolveSource(
        `import type { TreeT } from "@/types/discovery/tree";\nexport type json = { root: TreeT };`,
        { closedTypes: ["json"] },
      );
      const valid = checker(resolvedTypes?.[0]?.jsonSchema as JsonSchema);
      const deep = (n: number): unknown => {
        return { id: n, children: n ? [deep(n - 1)] : [] };
      };
      expect(valid({ root: deep(8) })).toBe(true);
      expect(
        valid({ root: { id: 1, children: [{ id: 2, children: [], x: 1 }] } }),
      ).toBe(false);
    });

    test("reaches only the files the names need", () => {
      const { referencedFiles } = resolveSource(
        `import type { TreeT } from "@/types/discovery/tree";\nimport type { User } from "@/types/discovery/user";\nexport type json = { root: TreeT };`,
      );
      expect(
        referencedFiles.map((f) => f.replace(`${project.root}/`, "")),
      ).toEqual(["types/discovery/tree.ts"]);
    });

    test("reports what it cannot follow, leaving the type unresolved", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const { resolvedTypes } = resolveSource(
          `import type { Broken } from "@/types/discovery/missing";\nexport type json = Broken;`,
        );
        const output = warn.mock.calls.flat().join("\n");
        expect(output).toMatch(/cannot resolve "\.\/nowhere"/);
        expect(output).toMatch(/could not be resolved/);
        expect(output).toMatch(/Nowhere/);
        const valid = checker(resolvedTypes?.[0]?.jsonSchema as JsonSchema);
        expect(valid({ value: 1 })).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    test("leaves the runtime's custom types to the runtime", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const { jsonSchema } = typeOf(`export type json = { at: Date };`);
        expect(jsonSchema.properties).toEqual({ at: { $ref: "Date" } });
        expect(warn).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
      }
    });

    test("collects the graph without evaluating", () => {
      const { resolvedTypes, referencedFiles } = resolveTypes(
        {
          file: entryFile,
          source: `import type { User } from "@/types/discovery/user";\nexport type json = User;`,
          route: "probe",
        },
        { names: ["json"], evaluate: false },
      );
      expect(resolvedTypes).toBeUndefined();
      expect(referencedFiles).toHaveLength(2);
    });
  });
});
