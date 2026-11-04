import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import { expectedFor, ROUTE, routeSource, writeSharedModules } from ".";

// the production API build, served by dist/api/server.js
describe("production build: hono", async ({ afterAll }) => {
  const project = await setupTestProject({ mode: "backend", backend: "hono" });

  const folder = project.sourceFolder.name;

  const teardown = await project.bootstrapProject(async () => {
    await writeSharedModules(project);
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource(folder);
    });
  });

  afterAll(teardown);

  test("api route", async ({ expect }) => {
    const { response } = await project.withApiResponse([ROUTE]);
    expect(JSON.parse(response.body as string)).toEqual(expectedFor(folder));
  });
});
