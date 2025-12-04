import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject } from "../setup";

const ssr = inject("SSR" as never);

describe(`Vue - Nested Routes: { ssr: ${ssr} }`, async () => {
  const {
    bootstrapProject,
    withRouteContent,
    createNestedRoutes,
    startServer,
    teardown,
  } = await setupTestProject({
    framework: "vue",
    ssr,
  });

  await bootstrapProject();

  await createNestedRoutes((name, file) => {
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
  });

  beforeAll(startServer);
  afterAll(teardown);

  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = [
      name,
      Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(";") || "index",
    ].join("/");

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
