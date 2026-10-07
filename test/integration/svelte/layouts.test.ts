import { load } from "cheerio";
import { describe, expect, test } from "vitest";

import { snapshotNameFor } from "..";
import { nestedRoutes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

describe("layouts", async ({ afterAll }) => {
  const {
    //
    bootstrapProject,
    withPageContent,
    createPageRoutes,
  } = await setupTestProject({ frontend: "svelte" });

  const teardown = await bootstrapProject(async () => {
    await createPageRoutes([...nestedRoutes], async ({ name, file }) => {
      return () => {
        if (file === "index") {
          // Route names contain braces (`blog/{category}`, `docs/{...path}`).
          // Svelte parses `{...}` as an expression in both text and quoted attribute values.
          return `<div>{${JSON.stringify(name)}}</div>`;
        }

        return `
            <script lang="ts">
              import type { Snippet } from "svelte";
              let { children }: { children: Snippet } = $props();
            </script>
            <div data-layout={${JSON.stringify(name)}}>{@render children()}</div>
          `;
      };
    });
  });

  afterAll(teardown);

  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      const { content } = await withPageContent([name, params]);
      const $ = load(content);
      await expect($("#app").html()).toMatchFileSnapshot(
        `../@snapshots/layouts/${snapshotName}.html`,
      );
    });
  }
});
