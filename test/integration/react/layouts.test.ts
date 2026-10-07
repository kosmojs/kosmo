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
  } = await setupTestProject({ frontend: "react" });

  const teardown = await bootstrapProject(async () => {
    await createPageRoutes([...nestedRoutes], async ({ name, file }) => {
      return () => {
        if (file === "index") {
          return `
            export default function Page() {
              return <div>{"${name}"}</div>;
            };
          `;
        }

        return `
          import { Outlet } from "react-router";
          export default function Layout(props) {
            return <div data-layout="${name}"><Outlet /></div>;
          };
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
      await expect(
        $("#app")
          .html()
          ?.replace(/<script>.+<\/script>$/m, ""),
      ).toMatchFileSnapshot(`../@snapshots/layouts/${snapshotName}.html`);
    });
  }
});
