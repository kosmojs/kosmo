import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const framework = "vue";
const ssr = inject("SSR" as never);

describe(`Vue - Nested Routes: { ssr: ${ssr} }`, async () => {
  const {
    bootstrapProject,
    withRouteContent,
    createRoutes,
    startServer,
    teardown,
  } = await setupTestProject({ framework, ssr });

  await bootstrapProject();

  await createRoutes(nestedRoutes, async ({ name, file }) => {
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

  beforeAll(startServer);
  afterAll(teardown);

  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      const { content } = await withRouteContent(name, params);
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
