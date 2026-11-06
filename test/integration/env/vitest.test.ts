import { writeFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";
import { createVitest, type TestRunResult } from "vitest/node";

import { DEFAULT_TEST_FILE } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import {
  expectedBackend,
  expectedFrontend,
  PREFIXED_TEST,
  pageSource,
  ROUTE,
  routeSource,
  setupEnv,
  testSource,
  UNPREFIXED_TEST,
} from ".";

// test files run by the project's own vitest:
// api tests read process.env, pages tests import.meta.env
describe("vitest harness: react + hono", async ({ afterAll }) => {
  const project = await setupTestProject(
    { frontend: "react", backend: "hono" },
    {
      frontend: { test: { seed: false } },
      backend: { test: { seed: false } },
    },
  );

  const { createPath } = pathResolver(project.project, project.sourceFolder);

  const testFiles = {
    api: createPath.api(ROUTE, DEFAULT_TEST_FILE),
    pages: createPath.pages(ROUTE, DEFAULT_TEST_FILE),
  };

  const env = setupEnv(project);

  const teardown = await project.bootstrapProject(async () => {
    await env.writeFiles();
    await project.createPageRoutes([{ name: ROUTE }], async () => pageSource);
    await project.createApiRoutes([{ name: ROUTE }], async () => routeSource);
    await writeFile(testFiles.api, testSource("backend", expectedBackend));
    await writeFile(testFiles.pages, testSource("frontend", expectedFrontend));
  });

  // what the inner vitest sees must come from its own config, not from the build above
  env.dropBuildEnv();

  const vitest = await createVitest({
    root: project.project.root,
    mode: "test",
    watch: false,
  });

  await vitest.standalone();

  afterAll(async () => {
    await vitest.close();
    await teardown();
    env.restore();
  });

  // errors of every test in the file, keyed by test name; vitest runs each file once
  const results = new Map<string, Promise<Record<string, Array<string>>>>();

  const resultsOf = (file: string) => {
    if (!results.has(file)) {
      results.set(
        file,
        vitest.runTestFiles([file]).then(({ testModules }: TestRunResult) => {
          const testModule = testModules.find((e) => e.moduleId === file);
          if (!testModule) {
            throw new Error(`${file} did not run`);
          }
          const moduleErrors = testModule.errors().map((e) => e.message);
          return Object.fromEntries(
            [...testModule.children.allTests()].map((testCase) => {
              const errors = testCase.result().errors ?? [];
              return [
                testCase.name,
                [...moduleErrors, ...errors.map((e) => e.message)],
              ];
            }),
          );
        }),
      );
    }
    return results.get(file) as Promise<Record<string, Array<string>>>;
  };

  const expectPassed = async (file: string, name: string) => {
    const { [name]: errors } = await resultsOf(file);
    expect(errors, `${name} did not run`).toBeDefined();
    expect(errors, errors?.join("\n")).toEqual([]);
  };

  test(`api: ${PREFIXED_TEST}`, async () => {
    await expectPassed(testFiles.api, PREFIXED_TEST);
  });

  test(`api: ${UNPREFIXED_TEST}`, async () => {
    await expectPassed(testFiles.api, UNPREFIXED_TEST);
  });

  test(`pages: ${PREFIXED_TEST}`, async () => {
    await expectPassed(testFiles.pages, PREFIXED_TEST);
  });

  /**
   * Known gap: both harness projects resolve in one process,
   * and the api project's backend env provider writes every key into its process.env,
   * which the pages workers inherit - and vitest backs import.meta.env with process.env.
   * So pages tests see unprefixed values a real page never gets.
   * Fails today; once fixed it passes, and vitest reports this test, prompting removal of .fails.
   * */
  test.fails(`pages: ${UNPREFIXED_TEST}`, async () => {
    await expectPassed(testFiles.pages, UNPREFIXED_TEST);
  });
});
