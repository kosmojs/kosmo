import { load } from "cheerio";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";

import { nestedRoutes, setupTestProject } from "../setup";

const ssr = inject("SSR" as never);

describe(`React - Nested Routes: { ssr: ${ssr} }`, async () => {
  const {
    bootstrapProject,
    withRouteContent,
    createNestedRoutes,
    startServer,
    teardown,
  } = await setupTestProject({
    framework: "react",
    ssr,
  });

  await bootstrapProject();

  await createNestedRoutes((name, file) => {
    if (file === "index") {
      return `
        export default function Page() {
          return <div>${name}</div>;
        };
      `;
    }

    return `
      import { Outlet } from "react-router";
      export default function Layout(props) {
        return <div data-layout="${name}"><Outlet /></div>;
      };
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
          ?.replace(/<script>.+<\/script>$/m, ""),
      ).toMatchFileSnapshot(`../@snapshots/nested-routes/${snapshotName}.html`);
    });
  }
});
