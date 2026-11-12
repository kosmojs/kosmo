import { describe, expect, test } from "vitest";

import { astFactory, parseSource } from "@kosmojs/lib";

describe("extractParamsRefinements", () => {
  const {
    //
    extractDefaultExport,
    extractParamsRefinements,
  } = astFactory();

  test("no refinements", ({ task }) => {
    const defaultExport = extractDefaultExport(
      parseSource(`${task.id}.ts`, "export default defineRoute()"),
    );
    const refinements = defaultExport
      ? extractParamsRefinements(defaultExport)
      : [];
    expect(refinements).toBeUndefined();
  });

  test("single refinement", ({ task }) => {
    const defaultExport = extractDefaultExport(
      parseSource(
        `${task.id}.ts`,
        `export default defineRoute<"", [number]>()`,
      ),
    );
    const refinements = defaultExport
      ? extractParamsRefinements(defaultExport)
      : [];
    expect(refinements).toEqual([
      {
        index: 0,
        text: "number",
      },
    ]);
  });

  test("multiple refinements", ({ task }) => {
    const defaultExport = extractDefaultExport(
      parseSource(
        `${task.id}.ts`,
        `export default defineRoute<"", [number, "a" | "b"]>()`,
      ),
    );
    const refinements = defaultExport
      ? extractParamsRefinements(defaultExport)
      : [];
    expect(refinements).toEqual([
      {
        index: 0,
        text: "number",
      },
      {
        index: 1,
        text: `"a" | "b"`,
      },
    ]);
  });

  test("with referenced elements", ({ task }) => {
    const defaultExport = extractDefaultExport(
      parseSource(
        `${task.id}.ts`,
        `type T = string; export default defineRoute<"", [T]>()`,
      ),
    );
    const refinements = defaultExport
      ? extractParamsRefinements(defaultExport)
      : [];
    expect(refinements).toEqual([
      {
        index: 0,
        text: "T",
      },
    ]);
  });

  test("should return undefined for referenced types", ({ task }) => {
    const defaultExport = extractDefaultExport(
      parseSource(
        `${task.id}.ts`,
        `type T = [string]; export default defineRoute<"", T>()`,
      ),
    );
    const refinements = defaultExport
      ? extractParamsRefinements(defaultExport)
      : [];
    expect(refinements).toBeUndefined();
  });
});
