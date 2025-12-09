import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject, snapshotNameFor } from "../setup";

const framework = "solid";
const ssr = inject("SSR" as never);

describe(`SolidJS - Nested Routes: { ssr: ${ssr} }`, async () => {
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
          export default function Page() {
            return <div>${name}</div>;
          };
        `;
      }

      return `
        export default function Layout(props) {
          return <div data-layout="${name}">{props.children}</div>;
        };
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
        $("#app").html()?.trim()?.replace("<!--app-html-->", ""),
      ).toMatchFileSnapshot(`../@snapshots/nested-routes/${snapshotName}.html`);
    });
  }
});
