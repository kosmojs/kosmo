import { describe, expect, test } from "vitest";

import { pluginOptions } from ".";

import { defaults } from "@src/defaults";
import { nestedRoutesFactory } from "@src/routes-factory/nesting";
import { createRouteEntry, scanRoutes } from "@src/routes-factory/resolve";
import type { NestedRouteEntry } from "@src/types";

describe("Nested Routes", async () => {
  const routeFiles = await scanRoutes(pluginOptions);

  const routeEntries = routeFiles
    .flatMap((file) => {
      const entry = createRouteEntry(file, pluginOptions);
      return entry?.folder === defaults.pagesDir ? [entry] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const tree = nestedRoutesFactory(routeEntries);

  const render = (
    entries: Array<NestedRouteEntry>,
  ): Array<NestedRouteEntry> => {
    return entries.map(({ index, layout, parent, children }) => {
      return { index, layout, parent, children: render(children) };
    });
  };

  const config = render(tree);

  for (const entry of config) {
    const { name } = { ...entry?.index, ...entry?.layout };
    test(`nestedRoutesFactory: ${name}`, async () => {
      await expect(JSON.stringify(entry, null, 2)).toMatchFileSnapshot(
        `@snapshots/nestedRoutesFactory/${name}.json`,
      );
    });
  }

  // it is highly important to also check whole config
  test("nestedRoutesFactory", async () => {
    await expect(JSON.stringify(config, null, 2)).toMatchFileSnapshot(
      "@snapshots/nestedRoutesFactory.json",
    );
  });
});
