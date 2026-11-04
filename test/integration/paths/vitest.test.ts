import { writeFile } from "node:fs/promises";

import { describe, test } from "vitest";
import { createVitest, type TestRunResult } from "vitest/node";

import { DEFAULT_TEST_FILE } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import {
  expectedFor,
  importsFor,
  pageSources,
  ROUTE,
  routeSource,
  writeSharedModules,
} from ".";

// test files run by the project's own vitest, through the harness's pages and api projects
describe("vitest harness: vue + hono", async ({ afterAll }) => {
  const project = await setupTestProject(
    { frontend: "vue", backend: "hono" },
    {
      frontend: { test: { seed: false } },
      backend: { test: { seed: false } },
    },
  );

  const folder = project.sourceFolder.name;

  const { createPath } = pathResolver(project.project, project.sourceFolder);

  const testFiles = [
    createPath.api(ROUTE, DEFAULT_TEST_FILE),
    createPath.pages(ROUTE, DEFAULT_TEST_FILE),
  ];

  const testSource = `
    import { expect, test } from "vitest";
    ${importsFor(folder)}
    test("mappings", () => {
      expect(mappings).toEqual(${JSON.stringify(expectedFor(folder))});
    });
  `;

  const teardown = await project.bootstrapProject(async () => {
    await writeSharedModules(project, "vue");
    await project.createPageRoutes([{ name: ROUTE }], async () => {
      return () => pageSources.vue(folder);
    });
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource(folder);
    });
    for (const file of testFiles) {
      await writeFile(file, testSource);
    }
  });

  const vitest = await createVitest({
    root: project.project.root,
    mode: "test",
    watch: false,
  });

  await vitest.standalone();

  afterAll(async () => {
    await vitest.close();
    await teardown();
  });

  test("api and pages test files", async ({ expect }) => {
    const { testModules, unhandledErrors }: TestRunResult =
      await vitest.runTestFiles(testFiles);

    // the result lists every module the vitest instance has run so far
    const requested = testModules.filter(({ moduleId }) => {
      return testFiles.includes(moduleId);
    });

    const failures = requested.flatMap((testModule) => {
      const errors = [
        ...testModule.errors(),
        ...[...testModule.children.allTests()].flatMap((testCase) => {
          return testCase.result().errors ?? [];
        }),
      ];
      return errors.map(({ message }) => `${testModule.moduleId}: ${message}`);
    });

    expect(failures, failures.join("\n")).toEqual([]);
    expect(unhandledErrors).toEqual([]);
    expect(requested.length).toEqual(testFiles.length);
  });
});
