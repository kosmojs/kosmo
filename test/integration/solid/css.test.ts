import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const framework = "solid";
const ssr = inject("SSR" as never);
const skip = !ssr;

describe(`SolidJS - Critical CSS: { ssr: ${ssr} }`, { skip }, async () => {
  const {
    bootstrapProject,
    withRouteContent,
    createRoutes,
    startServer,
    teardown,
  } = await setupTestProject({ framework, skip, ssr });

  await bootstrapProject();

  await createRoutes(nestedRoutes, async ({ name, file, cssFile }) => {
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
