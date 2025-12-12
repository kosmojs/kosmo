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
  framework: "solid",
  // skip if not SSR mode
  skip: ({ ssr }) => !ssr,
});

beforeAll(startServer);
afterAll(teardown);

describe("SolidJS - Critical CSS", { skip }, async () => {
  await bootstrapProject();

  await createPageRoutes(nestedRoutes, async ({ name, file, cssFile }) => {
    return () => {
      if (file === "layout") {
        return `
          import type { ParentComponent } from "solid-js";
          import "${cssFile}";
          const Layout: ParentComponent = (props) => {
            return <div>${name} layout {props.children}</div>;
          }
          export default Layout;
        `;
      }
      return `
        import "${cssFile}";
        export default () => {
          return <div>${name}</div>;
        }
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
