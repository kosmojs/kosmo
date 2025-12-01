import { describe, expect, test } from "vitest";

import { sortRoutes } from "@kosmojs/devlib";

import {
  createRouteEntry,
  isIndexFile,
  scanRoutes,
} from "@/base-plugin/routes";

import { pluginOptions } from "./base";

describe("Routes Resolver", async () => {
  const routeFiles = await scanRoutes(pluginOptions);

  const routeEntries = routeFiles
    .flatMap((file) => {
      const entry = createRouteEntry(file, pluginOptions);
      return !entry || !isIndexFile(entry.file) ? [] : [entry];
    })
    .sort(sortRoutes)
    .map(({ fileFullpath, importName, importFile, ...entry }) => entry);

  for (const entry of routeEntries) {
    test(`createRouteEntry: ${entry.name}`, async () => {
      await expect(JSON.stringify(entry, null, 2)).toMatchFileSnapshot(
        `snapshots/createRouteEntry/${entry.name}.json`,
      );
    });
  }

  // also compare whole stack
  test("createRouteEntry", async () => {
    await expect(JSON.stringify(routeEntries, null, 2)).toMatchFileSnapshot(
      "snapshots/createRouteEntry.json",
    );
  });
});
