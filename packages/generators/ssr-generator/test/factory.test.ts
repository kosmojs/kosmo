import { describe, expect, test } from "vitest";

import { createRouteEntry } from "@kosmojs/dev/routes";

import { generateManifestPathVariations, generatePathPattern } from "@/factory";

const routes = [
  "about",
  "blog/posts",
  "blog/index.html",
  "users/[id]",
  "posts/[userId]/comments/[commentId]",
  "products/[[category]]",
  "search/[[query]]/[[page]]",
  "docs/[...path]",
  "shop/[category]/[[subcategory]]",
  "files/[bucket]/[...path]",
  "admin/[tenant]/resources/[[type]]/[...path]",
  "priority/profile",
  "priority/[id]",
];

describe("SSR Factory", { timeout: 60_000 }, () => {
  const appRoot = "/test";
  const sourceFolder = "@src";

  const pluginOptions = { appRoot, sourceFolder };

  test("generatePathPattern", async () => {
    const pathPatterns = [];

    for (const route of routes) {
      const routeEntry = createRouteEntry(
        `${sourceFolder}/pages/${route}/index.tsx`,
        pluginOptions,
      );
      expect(routeEntry).toBeTruthy();
      pathPatterns.push(generatePathPattern(routeEntry as never));
    }

    await expect(JSON.stringify(pathPatterns, null, 2)).toMatchFileSnapshot(
      `snapshots/generatePathPattern.json`,
    );
  });

  test("generateManifestPathVariations", async () => {
    const pathVariations = [];

    for (const route of routes) {
      const routeEntry = createRouteEntry(
        `${sourceFolder}/pages/${route}/index.tsx`,
        pluginOptions,
      );
      expect(routeEntry).toBeTruthy();
      pathVariations.push(generateManifestPathVariations(routeEntry as never));
    }

    await expect(JSON.stringify(pathVariations, null, 2)).toMatchFileSnapshot(
      `snapshots/generateManifestPathVariations.json`,
    );
  });
});
