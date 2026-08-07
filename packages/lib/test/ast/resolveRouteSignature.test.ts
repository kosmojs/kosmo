import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { astFactory } from "@kosmojs/lib";

describe("resolveRouteSignature", () => {
  const { createProject, resolveRouteSignature } = astFactory();

  const project = createProject();

  // resolveRouteSignature reads route.fileFullpath by default; tests inject an
  // in-memory sourceFile via opts so no file system access is needed.
  // The file path stays unique per task to avoid createSourceFile collisions;
  // routeId is separable because generated schema ids embed crc(route.id), so
  // snapshot tests pass a fixed routeId to keep those ids deterministic.
  const resolveSignature = (
    id: string,
    text: string,
    opts?: Parameters<typeof resolveRouteSignature>[1] & { routeId?: string },
  ) => {
    const { routeId = id, ...signatureOpts } = { ...opts };
    const fileFullpath = `${id}.ts`;
    const sourceFile = project.createSourceFile(fileFullpath, text);
    return resolveRouteSignature(
      { id: routeId, name: routeId, fileFullpath, optionalParams: false },
      { sourceFile, ...signatureOpts },
    );
  };

  test("empty route", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      "export default defineRoute()",
    );
    expect(signature).toEqual({
      typeDeclarations: [],
      paramsRefinements: undefined,
      methods: [],
      validationDefinitions: [],
      referencedFiles: undefined,
    });
  });

  test("no default export", async ({ task }) => {
    const signature = await resolveSignature(task.id, "export const x = 1");
    expect(signature).toEqual({
      typeDeclarations: [],
      paramsRefinements: undefined,
      methods: [],
      validationDefinitions: [],
      referencedFiles: undefined,
    });
  });

  test("detects methods", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      `
        export default defineRoute(({ GET, POST, DELETE }) => [
          GET(),
          POST(),
          DELETE(),
        ])
      `,
    );
    expect(signature.methods).toEqual(["GET", "POST", "DELETE"]);
  });

  test("extracts params refinements", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      `export default defineRoute<"users/[id]", [number]>(({ GET }) => [ GET() ])`,
    );
    expect(signature.paramsRefinements).toEqual([{ index: 0, text: "number" }]);
  });

  test("flattens validation definitions across methods", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      `
        export default defineRoute(({ GET, POST }) => [
          GET<{ query: { page?: number } }>(),
          POST<{ json: { id?: number } }>(),
        ])
      `,
    );
    expect(signature.methods).toEqual(["GET", "POST"]);
    expect(signature.validationDefinitions.map((def) => def.target)).toEqual([
      "query",
      "json",
    ]);
  });

  test("collects type declarations", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      `
        type Payload = { id: number };
        export default defineRoute(({ POST }) => [
          POST<{ json: Payload }>(),
        ])
      `,
    );
    expect(signature.typeDeclarations).toEqual([
      {
        text: "type Payload = { id: number };",
        typeAliasDeclaration: { name: "Payload" },
      },
    ]);
  });

  test("passes relpathResolver through to type declarations", async ({
    task,
  }) => {
    const signature = await resolveSignature(
      task.id,
      `import type { A } from "./a"; export default defineRoute()`,
      { relpathResolver: (path) => `/app/${path}` },
    );
    expect(signature.typeDeclarations).toEqual([
      {
        importDeclaration: { alias: undefined, name: "A", path: "/app/./a" },
        text: `import type { A } from "/app/./a";`,
      },
    ]);
  });

  test("resolves referenced files when requested", async () => {
    // Referenced-file resolution needs node lib types and a real file on disk,
    // mirroring the extractTypeDeclarations fixture setup.
    const nodeProject = createProject({
      compilerOptions: { types: ["@types/node"] },
    });
    const fileFullpath = resolve(
      import.meta.dirname,
      "../@fixtures/ast/extractTypeDeclarations/imports/with-referenced-files.ts",
    );
    const sourceFile = nodeProject.addSourceFileAtPath(fileFullpath);

    const signature = await resolveRouteSignature(
      { id: "ref", name: "ref", fileFullpath, optionalParams: false },
      { sourceFile, withReferencedFiles: true },
    );

    expect(signature.typeDeclarations).toEqual([
      {
        importDeclaration: {
          alias: undefined,
          name: "ParsedPath",
          path: "node:path",
        },
        text: `import type { ParsedPath } from "node:path";`,
      },
    ]);
    expect(signature.referencedFiles?.[0]).toMatch(/node\/path.d.ts$/);
  });

  test("full signature snapshot", async ({ task }) => {
    const signature = await resolveSignature(
      task.id,
      `
        type Payload = { id: number };
        export default defineRoute<"users/[id]", [number]>(({ GET, POST }) => [
          GET<{ query: { page?: number } }>(),
          POST<
            {
              json: Payload,
              response: [200, "json", { ok: boolean }],
            }
          >(),
        ])
      `,
      { routeId: "snapshot" },
    );
    await expect(JSON.stringify(signature, null, 2)).toMatchFileSnapshot(
      "@snapshots/resolveRouteSignature/full-signature.json",
    );
  });
});
