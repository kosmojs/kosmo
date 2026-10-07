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
  } = await setupTestProject({ frontend: "vue" });

  const teardown = await bootstrapProject(async () => {
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
