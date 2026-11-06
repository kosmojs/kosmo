import { describe, test } from "vitest";

import { setupTestProject } from "../setup";
import {
  expectedFrontend,
  filesWithSecret,
  pageSource,
  ROUTE,
  readPageEnv,
  setupEnv,
} from ".";

// pages pre-rendered at build time, served by dist/run.js
describe("static generation: react", async ({ afterAll }) => {
  const project = await setupTestProject(
    { mode: "ssg", frontend: "react", backend: "hono" },
    { frontend: { ssr: true } },
  );

  const env = setupEnv(project);

  const teardown = await project.bootstrapProject(async () => {
    await env.writeFiles();
    await project.createPageRoutes([{ name: ROUTE }], async () => pageSource);
  });

  afterAll(async () => {
    await teardown();
    env.restore();
  });

  test("pre-rendered page reads import.meta.env", async ({ expect }) => {
    const { content } = await project.withPageContent([ROUTE]);
    expect(readPageEnv(content), content).toEqual(expectedFrontend);
  });

  test("no built file carries an unprefixed value", async ({ expect }) => {
    const { files, hits } = await filesWithSecret(project);
    expect(files).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });
});
