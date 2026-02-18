import { describe, expect, test } from "vitest";

import { pluginOptions } from ".";

import { sortRoutes } from "@src/routes-factory/base";
import { createRouteEntry, scanRoutes } from "@src/routes-factory/resolve";

describe("Routes Resolver", async () => {
  const routeFiles = await scanRoutes(pluginOptions);

  const routeEntries = routeFiles
    .flatMap((file) => {
      const entry = createRouteEntry(file, pluginOptions);
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
