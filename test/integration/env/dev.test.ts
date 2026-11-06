import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import {
  expectedBackend,
  expectedFrontend,
  pageSource,
  ROUTE,
  readPageEnv,
  routeSource,
  setupEnv,
} from ".";

// the dev server: the page through Vite's client graph, the route through the dev backend
describe("dev server: react + hono", async ({ afterAll }) => {
  const project = await setupTestProject({
    mode: "csr",
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

  test("page reads import.meta.env", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    expect(readPageEnv(content), content).toEqual(expectedFrontend);
  });

  test("api route reads process.env", async ({ expect }) => {
    const { response } = await project.withApiResponse([ROUTE]);
    expect(JSON.parse(response.body as string)).toEqual(expectedBackend);
  });
});
