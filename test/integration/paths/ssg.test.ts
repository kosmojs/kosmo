import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import {
  expectedFor,
  pageSources,
  ROUTE,
  readPage,
  WIDGET_TEXT,
  writeSharedModules,
} from ".";

// pages pre-rendered at build time, served by dist/run.js
describe("static generation: vue", async ({ afterAll }) => {
  const project = await setupTestProject(
    { mode: "ssg", frontend: "vue", backend: "hono" },
    { frontend: { ssr: true } },
  );

  const folder = project.sourceFolder.name;

  const teardown = await project.bootstrapProject(async () => {
    await writeSharedModules(project, "vue");
    await project.createPageRoutes([{ name: ROUTE }], async () => {
      return () => pageSources.vue(folder);
    });
  });

  afterAll(teardown);

  test("pre-rendered page", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    const { mappings, widget } = readPage(content);
    expect(mappings, content).toEqual(expectedFor(folder));
    expect(widget, content).toBe(WIDGET_TEXT.vue);
  });
});
