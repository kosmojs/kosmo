import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import {
  expectedFrontend,
  filesWithSecret,
  pageSource,
  ROUTE,
  readPageEnv,
  routeSource,
  setupEnv,
} from ".";

/**
 * The SSR bundle: the page rendered on the server, and every built file checked for the secret.
 * The api route is not asserted here: the bundle runs in the test process,
 * whose process.env the backend env provider filled during the build,
 * so it would pass whatever a standalone server sees.
 * */
describe("ssr bundle: react + hono", async ({ afterAll }) => {
  const project = await setupTestProject({
    mode: "ssr",
    frontend: "react",
    backend: "hono",
  });

  const env = setupEnv(project);

  const teardown = await project.bootstrapProject(async () => {
    await env.writeFiles();
    await project.createPageRoutes([{ name: ROUTE }], async () => pageSource);
    await project.createApiRoutes([{ name: ROUTE }], async () => routeSource);
  });

  afterAll(async () => {
    await teardown();
    env.restore();
  });

  test("server-rendered page reads import.meta.env", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    expect(readPageEnv(content), content).toEqual(expectedFrontend);
  });

  test("no built file carries an unprefixed value", async ({ expect }) => {
    const { files, hits } = await filesWithSecret(project);
    expect(files).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });
});
