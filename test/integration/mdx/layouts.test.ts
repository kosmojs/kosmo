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
} = await setupTestProject({ framework: "mdx" });

beforeAll(async () => {
  await bootstrapProject();

  await createPageRoutes([...nestedRoutes], async ({ name, file }) => {
    return () => {
      if (file === "index") {
        return `<div>{"${name}"}</div>`;
      }

      return `<div data-layout="${name}">{props.children}</div>`;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("MDX - Layouts", async () => {
  for (const { name, params } of nestedRoutes.filter(
    (e) => e.file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      const { content } = await withPageContent([name, params]);
      const $ = load(content);
      await expect(
        $("#app").html()?.trim()?.replace("<!--app-html-->", ""),
      ).toMatchFileSnapshot(`../@snapshots/layouts/${snapshotName}.html`);
    });
  }
});
