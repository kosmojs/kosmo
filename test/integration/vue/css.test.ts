import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const {
  skip,
  bootstrapProject,
  startServer,
  teardown,
  withPageContent,
  createPageRoutes,
} = await setupTestProject({
  framework: "vue",
  // skip if not SSR mode
  skip: ({ ssr }) => !ssr,
});

beforeAll(startServer);
afterAll(teardown);

describe("Vue - Critical CSS", { skip }, async () => {
  await bootstrapProject();

  await createPageRoutes(nestedRoutes, async ({ name, file, cssFile }) => {
    return () => {
      if (file === "layout") {
        return `
          <script setup>
            import "${cssFile}";
          </script>
          <template>
            <div>${name} layout <router-view /></div>
          </template>
        `;
      }
      return `
        <script setup>
          import "${cssFile}";
        </script>
        <template>
          <div>${name}</div>
        </template>
      `;
    };
  });

  for (const { name, params } of nestedRoutes.filter(
    ({ file }) => file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      await withPageContent(name, params, async ({ content }) => {
        const $ = load(content);
        const styles = $("style")
          .map((_, el) => $(el).html()?.trim())
          .get()
          .join("\n");
        await expect(styles).toMatchFileSnapshot(
          `../@snapshots/css/${snapshotName}.css`,
        );
      });
    });
  }
});
