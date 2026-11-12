import { describe, expect, test } from "vitest";

import { astFactory, parseSource } from "@kosmojs/lib";

import type { ParsedSource, PathResolver } from "#/ast";

describe("extractTypeDeclarations", { timeout: 10_000 }, () => {
  const { extractTypeDeclarations } = astFactory();

  const extractDeclarations = (
    f: ParsedSource,
    o?: {
      importSpecifierResolver?: PathResolver;
    },
  ) => {
    return extractTypeDeclarations(f, {
      importSpecifierResolver: o?.importSpecifierResolver || ((p) => p),
    });
  };

  describe("imports", () => {
    test("typeOnly imports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import type { A } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          importDeclaration: {
            alias: undefined,
            name: "A",
            path: "./a",
          },
          text: `import type { A } from "./a";`,
        },
      ]);
    });

    test("typeOnly aliased imports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import type { A as B } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          importDeclaration: {
            alias: "B",
            name: "A",
            path: "./a",
          },
          text: `import type { A as B } from "./a";`,
        },
      ]);
    });

    test("typeOnly combined imports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import type { A, B as C } from "./x"`,
      );
      expect(extractDeclarations(sourceFile)).toEqual([
        {
          importDeclaration: {
            alias: undefined,
            name: "A",
            path: "./x",
          },
          text: `import type { A } from "./x";`,
        },
        {
          importDeclaration: {
            alias: "C",
            name: "B",
            path: "./x",
          },
          text: `import type { B as C } from "./x";`,
        },
      ]);
    });

    test("default imports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import type A from "./a"`,
      );
      expect(extractDeclarations(sourceFile)).toEqual([
        {
          importDeclaration: {
            name: "A",
            path: "./a",
          },
          text: `import type A from "./a";`,
        },
      ]);
    });

    test("mixed imports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import { type A, type B as C, x } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          importDeclaration: {
            alias: undefined,
            name: "A",
            path: "./a",
          },
          text: `import type { A } from "./a";`,
        },
        {
          importDeclaration: {
            alias: "C",
            name: "B",
            path: "./a",
          },
          text: `import type { B as C } from "./a";`,
        },
      ]);
    });

    test("with path resolver", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `import type { A } from "./a"`,
      );
      expect(
        extractDeclarations(sourceFile, {
          importSpecifierResolver: (path) => `/app/${path}`,
        }),
      ).toEqual([
        {
          importDeclaration: {
            alias: undefined,
            name: "A",
            path: "/app/./a",
          },
          text: `import type { A } from "/app/./a";`,
        },
      ]);
    });
  });

  describe("exports", () => {
    test("typeOnly exports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export type A = "a"; type B = "b"; export type { B }`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          text: `export type A = "a";`,
          typeAliasDeclaration: {
            name: "A",
          },
        },
        {
          text: `type B = "b";`,
          typeAliasDeclaration: {
            name: "B",
          },
        },
        {
          exportDeclaration: {
            alias: "B",
            name: "B",
          },
          text: "export type { B };",
        },
      ]);
    });

    test("typeOnly aliased exports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export type A = "a"; export type { A  as  B }`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          text: `export type A = "a";`,
          typeAliasDeclaration: {
            name: "A",
          },
        },
        {
          exportDeclaration: {
            alias: "B",
            name: "A",
          },
          text: "export type { A as B };",
        },
      ]);
    });

    test("mixed exports", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export { type A as B, type C, x }`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          exportDeclaration: {
            alias: "B",
            name: "A",
            path: undefined,
          },
          text: "export type { A as B };",
        },
        {
          exportDeclaration: {
            alias: "C",
            name: "C",
            path: undefined,
          },
          text: "export type { C };",
        },
      ]);
    });

    test("typeOnly export from path", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export type {  A  } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          exportDeclaration: {
            alias: "A",
            name: "A",
            path: "./a",
          },
          text: `export type { A } from "./a";`,
        },
      ]);
    });

    test("mixed export from path", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export { type A, type B as C, x } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile);
      expect(typeDeclarations).toEqual([
        {
          exportDeclaration: {
            alias: "A",
            name: "A",
            path: "./a",
          },
          text: `export type { A } from "./a";`,
        },
        {
          exportDeclaration: {
            alias: "C",
            name: "B",
            path: "./a",
          },
          text: `export type { B as C } from "./a";`,
        },
      ]);
    });

    test("export from path with pathResolver", ({ task }) => {
      const sourceFile = parseSource(
        `${task.id}.ts`,
        `export type { A } from "./a"`,
      );
      const typeDeclarations = extractDeclarations(sourceFile, {
        importSpecifierResolver: (path) => path.replace(".", ""),
      });
      expect(typeDeclarations).toEqual([
        {
          exportDeclaration: {
            alias: "A",
            name: "A",
            path: "/a",
          },
          text: `export type { A } from "/a";`,
        },
      ]);
    });
  });

  test("types", ({ task }) => {
    const sourceFile = parseSource(
      `${task.id}.ts`,
      `type A = "A"; export type B = A & { C: "C" }`,
    );
    const typeDeclarations = extractDeclarations(sourceFile);
    expect(typeDeclarations).toEqual([
      {
        text: `type A = "A";`,
        typeAliasDeclaration: {
          name: "A",
        },
      },
      {
        text: `export type B = A & { C: "C" }`,
        typeAliasDeclaration: {
          name: "B",
        },
      },
    ]);
  });

  test("interfaces", ({ task }) => {
    const sourceFile = parseSource(
      `${task.id}.ts`,
      `interface A {}; export interface B extends A {}`,
    );
    const typeDeclarations = extractDeclarations(sourceFile);
    expect(typeDeclarations).toEqual([
      {
        interfaceDeclaration: {
          name: "A",
        },
        text: "interface A {}",
      },
      {
        interfaceDeclaration: {
          name: "B",
        },
        text: "export interface B extends A {}",
      },
    ]);
  });

  test("enums", ({ task }) => {
    const sourceFile = parseSource(
      `${task.id}.ts`,
      `enum A {}; export enum B {}`,
    );
    const typeDeclarations = extractDeclarations(sourceFile);
    expect(typeDeclarations).toEqual([
      {
        enumDeclaration: {
          name: "A",
        },
        text: "enum A {}",
      },
      {
        enumDeclaration: {
          name: "B",
        },
        text: "export enum B {}",
      },
    ]);
  });
});
