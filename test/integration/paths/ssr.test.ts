import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import {
  expectedFor,
  pageSources,
  ROUTE,
  readPage,
  routeSource,
  WIDGET_TEXT,
  writeSharedModules,
} from ".";

// the SSR bundle, served by dist/ssr/server.js
describe("ssr bundle: vue + hono", async ({ afterAll }) => {
  const project = await setupTestProject({
    mode: "ssr",
    frontend: "vue",
    backend: "hono",
  });

  const folder = project.sourceFolder.name;

  const teardown = await project.bootstrapProject(async () => {
    await writeSharedModules(project, "vue");
    await project.createPageRoutes([{ name: ROUTE }], async () => {
      return () => pageSources.vue(folder);
    });
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource(folder);
    });
  });

  afterAll(teardown);

  test("server-rendered page", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    const { mappings, widget } = readPage(content);
    expect(mappings, content).toEqual(expectedFor(folder));
    expect(widget, content).toBe(WIDGET_TEXT.vue);
  });

  test("api route", async ({ expect }) => {
    const { response } = await project.withApiResponse([ROUTE]);
    expect(JSON.parse(response.body as string)).toEqual(expectedFor(folder));
  });
});
