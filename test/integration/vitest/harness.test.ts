import { describe, expect, test } from "vitest";
import { createVitest, type TestRunResult } from "vitest/node";

import { DEFAULT_TEST_FILE } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import { routes } from ".";

// the dev server answers with the client shell, the SSR preview with the rendered page
const pageAssertions = {
  csr: `expect(html).toContain("<!--app-html-->");`,
  ssr: `
    expect(html).not.toContain("<!--app-html-->");
    expect(html).toContain(">{{route.name}}<");
  `,
};

// runTestFiles resolves whatever the inner tests do; their failures have to be read off the result
const expectAllPassed = (
  { testModules, unhandledErrors }: TestRunResult,
  files: Array<string>,
) => {
  // the result lists every module the vitest instance has run so far
  const requested = testModules.filter(({ moduleId }) => {
    return files.includes(moduleId);
  });
  const failures = requested.flatMap((testModule) => {
    return testModule.ok()
      ? []
      : [...testModule.children.allTests()].flatMap((testCase) => {
          return (
            testCase.result().errors?.map((error) => {
              return `${testCase.fullName}: ${error.message}`;
            }) ?? []
          );
        });
  });
  expect(failures, failures.join("\n")).toEqual([]);
  expect(unhandledErrors).toEqual([]);
  expect(requested.length).toEqual(files.length);
};

for (const ssr of [false, true]) {
  describe(`harness: ${ssr ? "ssr" : "csr"}`, async ({ afterAll }) => {
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
          ssr,
          test: {
            ssr,
            seed: {
              "**": `
              import { test, expect } from "vitest";
              import { prepareHarness } from "_/test/pages";
              const { page, pages, route } = await prepareHarness("{{route.name}}");
              test(route, async () => {
                expect(route).toEqual("{{route.name}}");
                const response = await fetch(page.href());
                expect(response.status).toEqual(200);
                const html = await response.text();
                ${ssr ? pageAssertions.ssr : pageAssertions.csr}
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
      const files = routes.map((route) => {
        return createPath.api(route, DEFAULT_TEST_FILE);
      });
      expectAllPassed(await vitest.runTestFiles(files), files);
    });

    test("frontend", async () => {
      const files = routes.map((route) => {
        return createPath.pages(route, DEFAULT_TEST_FILE);
      });
      expectAllPassed(await vitest.runTestFiles(files), files);
    });
  });
}
