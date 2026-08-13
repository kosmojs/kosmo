import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { nestedRoutes } from "../@fixtures/generic/routes";
import { setupTestProject, snapshotNameFor } from "../setup";

const {
  bootstrapProject,
  withPageContent,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({ framework: "svelte" });

beforeAll(async () => {
  await bootstrapProject();

  await createPageRoutes([...nestedRoutes], async ({ name, file }) => {
    return () => {
      // Route names contain braces (`blog/{category}`, `docs/{...path}`).
      // Svelte parses `{...}` as an expression in both text and quoted
      // attribute values, so the name is emitted as a string expression in
      // both places - a plain `<div data-layout="blog/{category}">` compiles
      // but throws `category is not defined` at render time.
      if (file === "index") {
        return `<div>{${JSON.stringify(name)}}</div>`;
      }

      return `<script lang="ts">
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>
<div data-layout={${JSON.stringify(name)}}>{@render children()}</div>`;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("Svelte - Layouts", async () => {
  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      const { content } = await withPageContent([name, params]);
      const $ = load(content);
      await expect(
        // Svelte SSR emits several kinds of hydration marker - `<!--[-->`,
        // `<!--]-->`, `<!--[0-->`, `<!--[-1-->`, `<!---->` - so every comment
        // is stripped rather than a fixed pair (which is all Vue needs). This
        // also removes the `<!--app-html-->` placeholder in CSR mode.
        $("#app")
          .html()
          ?.replace(/<!--[\s\S]*?-->/g, "")
          ?.trim(),
      ).toMatchFileSnapshot(`../@snapshots/layouts/${snapshotName}.html`);
    });
  }
});
