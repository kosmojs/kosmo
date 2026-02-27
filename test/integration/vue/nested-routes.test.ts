import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const {
  bootstrapProject,
  withPageContent,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({ framework: "vue" });

beforeAll(async () => {
  await bootstrapProject();

  await createPageRoutes([...nestedRoutes], async ({ name, file }) => {
    return () => {
      if (file === "index") {
        return `
        <template>
          <div>${name}</div>
        </template>
      `;
      }

      return `
      <template>
        <div data-layout="${name}"><router-view /></div>
      </template>
    `;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("Vue - Nested Routes", async () => {
  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      const { content } = await withPageContent(name, params);
      const $ = load(content);
      await expect(
        $("#app")
          .html()
          ?.trim()
          ?.replace(/<!--\[-->|<!--\]-->/g, ""),
      ).toMatchFileSnapshot(`../@snapshots/nested-routes/${snapshotName}.html`);
    });
  }
});
