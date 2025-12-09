import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const framework = "vue";
const ssr = inject("SSR" as never);
const skip = !ssr;

describe(`Vue - Critical CSS: { ssr: ${ssr} }`, { skip }, async () => {
  const {
    bootstrapProject,
    startServer,
    teardown,
    withRouteContent,
    createRoutes,
  } = await setupTestProject({ framework, skip, ssr });

  await bootstrapProject();

  await createRoutes(nestedRoutes, async ({ name, file, cssFile }) => {
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

  beforeAll(startServer);
  afterAll(teardown);

  for (const { name, params } of nestedRoutes.filter(
    ({ file }) => file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      await withRouteContent(name, params, async ({ content }) => {
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
