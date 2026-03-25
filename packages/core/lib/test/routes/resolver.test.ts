import { describe, expect, test } from "vitest";

import { sourceFolder } from ".";

import { createRouteEntry, scanRoutes, sortRoutes } from "@src/routes";

describe("Routes Resolver", async () => {
  const routeFiles = await scanRoutes(sourceFolder);

  const routeEntries = routeFiles
    .flatMap((file) => {
      const entry = createRouteEntry(file, sourceFolder);
      return entry ? [entry] : [];
    })
    .sort(sortRoutes)
    .map(({ fileFullpath, ...entry }) => entry);

  for (const entry of routeEntries) {
    test(`createRouteEntry: ${entry.name}`, async () => {
      await expect(JSON.stringify(entry, null, 2)).toMatchFileSnapshot(
        `@snapshots/createRouteEntry/${entry.file}.json`,
      );
    });
  }

  // also compare whole stack
  test("createRouteEntry", async () => {
    await expect(JSON.stringify(routeEntries, null, 2)).toMatchFileSnapshot(
      "@snapshots/createRouteEntry.json",
    );
  });
});
