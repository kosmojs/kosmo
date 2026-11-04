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

// the dev server resolves through the plugin alone,
// so this is the graph where a missing prefix shows up first
describe("dev server: vue + hono", async ({ afterAll }) => {
  const project = await setupTestProject({
    mode: "csr",
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

  test("page", async ({ expect }) => {
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

// .svelte is the other extension an extensionless component import must probe
describe("dev server: svelte", async ({ afterAll }) => {
  const project = await setupTestProject({ mode: "csr", frontend: "svelte" });

  const folder = project.sourceFolder.name;

  const teardown = await project.bootstrapProject(async () => {
    await writeSharedModules(project, "svelte");
    await project.createPageRoutes([{ name: ROUTE }], async () => {
      return () => pageSources.svelte(folder);
    });
  });

  afterAll(teardown);

  test("page", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    const { mappings, widget } = readPage(content);
    expect(mappings, content).toEqual(expectedFor(folder));
    expect(widget, content).toBe(WIDGET_TEXT.svelte);
  });
});
