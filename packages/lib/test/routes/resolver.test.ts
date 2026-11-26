import { describe, expect, test } from "vitest";

import { createRouteEntry, scanRoutes, sortRoutes } from "@kosmojs/lib";

import { project, sourceFolder } from "..";

describe("Routes Resolver", async () => {
  const routeFiles = await scanRoutes(project, sourceFolder);

  const routeEntries = routeFiles
    .flatMap((file) => {
      const entry = createRouteEntry(project, sourceFolder, file);
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

  // pages/orphan holds a page.tsx and no index.ts
  test("a page file without an index.ts beside it is not scanned", () => {
    expect(routeFiles.filter((file) => file.includes("/orphan/"))).toEqual([]);
  });

  // also compare whole stack
  test("createRouteEntry", async () => {
    await expect(JSON.stringify(routeEntries, null, 2)).toMatchFileSnapshot(
      "@snapshots/createRouteEntry.json",
    );
  });
});
