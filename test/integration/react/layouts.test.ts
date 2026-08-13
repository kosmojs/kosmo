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
} = await setupTestProject({ framework: "react" });

beforeAll(async () => {
  await bootstrapProject();

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

  await startServer();
});

afterAll(teardown);

describe("React - Layouts", async () => {
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
          ?.trim()
          ?.replace(/<script>.+<\/script>$/m, "")
          ?.replace("<!--app-html-->", ""),
      ).toMatchFileSnapshot(`../@snapshots/layouts/${snapshotName}.html`);
    });
  }
});
