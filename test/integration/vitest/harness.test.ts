import { describe, test } from "vitest";
import { createVitest } from "vitest/node";

import { DEFAULT_TEST_FILE } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import { routes } from ".";

describe("harness", async ({ afterAll }) => {
  const {
    project,
    sourceFolder,
    bootstrapProject,
    createApiRoutes,
    createPageRoutes,
  } = await setupTestProject(
    {
      backend: "koa",
      frontend: "solid",
    },
    {
      backend: {
        test: {
          seed: {
            "**": `
              import { test, expect } from "vitest";
              import { prepareHarness } from "_/test/api";
              const { client, clients, route } = await prepareHarness("{{route.name}}");
              test(route, async () => {
                expect(route).toEqual("{{route.name}}");
                const { response, body } = await client.GET();
                expect(response.status).toEqual(200);
                expect(body.route).toEqual(route);
              })
            `,
          },
        },
      },
      frontend: {
        test: {
          seed: {
            "**": `
              import { test, expect } from "vitest";
              import { prepareHarness } from "_/test/pages";
              const { page, pages, route } = await prepareHarness("{{route.name}}");
              test(route, async () => {
                expect(route).toEqual("{{route.name}}");
                const response = await fetch(page.href());
                expect(response.status).toEqual(200);
                expect(await response.text()).toMatch("<!--app-html-->");
              })
            `,
          },
        },
      },
    },
  );

  const teardown = await bootstrapProject(async () => {
    await createApiRoutes(
      routes.map((name) => ({ name })),
      async ({ name }) => {
        return () => `
          import { defineRoute } from "_/api";
          export default defineRoute<"${name}">(({ GET }) => [
            GET((ctx) => { ctx.body = { route: "${name}" }; }),
          ]);
        `;
      },
    );

    await createPageRoutes(
      routes.map((name) => ({ name })),
      async ({ name }) => {
        return () => `
          export default function Page() {
            return <div>{"${name}"}</div>;
          };
        `;
      },
    );
  });

  const { createPath } = pathResolver(project, sourceFolder);

  const vitest = await createVitest({
    root: project.root,
    mode: "test",
    watch: false,
  });

  await vitest.standalone();

  afterAll(async () => {
    await vitest.close();
    await teardown();
  });

  test("backend", async () => {
    await vitest.runTestFiles(
      routes.map((route) => createPath.api(route, DEFAULT_TEST_FILE)),
    );
  });

  test("frontend", async () => {
    await vitest.runTestFiles(
      routes.map((route) => createPath.pages(route, DEFAULT_TEST_FILE)),
    );
  });
});
