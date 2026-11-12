import { describe, expect, test } from "vitest";

import { routesFactory } from "@kosmojs/lib";

import { sourceFolder as baseSourceFolder, project } from "..";

describe("route graph", async () => {
  // a generator asking for the validation types to be evaluated
  const sourceFolder = {
    ...baseSourceFolder,
    generators: [
      {
        ...baseSourceFolder.generators[0],
        meta: { name: "", resolveTypes: true },
      },
    ],
  } as typeof baseSourceFolder;

  const { resolvers } = await routesFactory(
    { ...project, sourceFolders: [sourceFolder] },
    sourceFolder,
  );

  const entries = new Map();

  for (const { handler } of resolvers.values()) {
    const { kind, entry } = await handler();
    if (kind === "apiRoute") {
      entries.set(entry.name, entry);
    }
  }

  // a change in any file the validation types reach rebuilds the route
  test("lists every file the validation types reach, transitively", () => {
    const entry = entries.get("discovery");

    const files = entry.referencedFiles
      .map((file: string) => file.replace(`${project.root}/`, ""))
      .sort();

    expect(files).toEqual([
      "types/discovery/base.ts",
      "types/discovery/index.ts",
      "types/discovery/user.ts",
    ]);
  });

  test("evaluates the validation types across those files", () => {
    const entry = entries.get("discovery");

    const json = entry.validationDefinitions.find(
      (def: { target: string }) => def.target === "json",
    );

    const users = json.schema.resolvedType.jsonSchema.properties.users;

    expect(users.properties.items.items.properties.status.anyOf).toEqual([
      { type: "string", const: "active" },
      { type: "string", const: "inactive" },
    ]);

    // json is closed
    expect(users.properties.items.items.additionalProperties).toBe(false);
  });
});
