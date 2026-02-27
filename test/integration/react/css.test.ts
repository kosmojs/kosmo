import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const {
  skip,
  bootstrapProject,
  withPageContent,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({
  framework: "react",
  // skip if not SSR mode
  skip: ({ ssr }) => !ssr,
});

beforeAll(async () => {
  await bootstrapProject();

  await createPageRoutes([...nestedRoutes], async ({ name, file, cssFile }) => {
    return () => {
      if (file === "layout") {
        return `
          import { Outlet } from "react-router";
          import "${cssFile}";
          export default () => {
            return <div>{"${name}"} layout <Outlet /></div>;
          }
        `;
      }

      return `
        import "${cssFile}";
        export default () => {
          return <div>{"${name}"}</div>;
        }
      `;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("React - Critical CSS", { skip }, async () => {
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
