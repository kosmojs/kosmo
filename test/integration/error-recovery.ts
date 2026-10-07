import { join } from "node:path";

import { load } from "cheerio";
import got from "got";
import { inject, type TestFunction } from "vitest";

import type { FRONTENDS, ProjectSettings, SourceFolder } from "@kosmojs/core";
import { render } from "@kosmojs/lib";

import * as templates from "./@fixtures/error-recovery/templates";
import { setupTestProject } from "./setup";

type TestEntry = [path: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

const mode = inject("MODE");

// If SSR fails (due to loader/fetch error or render failure),
// the server returns the CSR fallback (index.html) without data,
// allowing client-side rendering to take over.
// This is a server-render concern, so the suite only runs under SSR.
export const skip = mode !== "ssr";

const OK_MESSAGE = "recovery-ok-payload";

const routes = [
  { name: "recover/ok", file: "index", params: {} },
  { name: "recover/fail", file: "index", params: {} },
];

const apiRoutes = [
  { name: "ok", file: "index" },
  { name: "fail", file: "index" },
];

export const createTestGroups = ({
  frontend,
  tsqModes = frontend === "mdx" // no tanstack query on mdx
    ? [false]
    : [false, true],
}: {
  frontend: keyof typeof FRONTENDS;
  tsqModes?: Array<boolean>;
}) => {
  const testGroups: Array<TestGroup> = [];

  for (const tsq of tsqModes) {
    const createHarness = async () => {
      const {
        project,
        sourceFolder,
        bootstrapProject,
        createApiRoutes,
        createPageRoutes,
      } = await setupTestProject(
        {
          frontend,
          backend: "hono",
          skip,
        },
        {
          frontend: {
            ssr: { renderMode: "string" },
            tanstack: { query: tsq ? true : false },
          },
        },
      );

      const tests: Array<TestEntry> = [];

      const teardown = await bootstrapProject(async () => {
        await createApiRoutes(apiRoutes, async ({ name }) => {
          return () =>
            render(name === "fail" ? templates.honoFail : templates.honoOk, {
              OK_MESSAGE,
            });
        });

        const variant = tsq ? "Tsq" : "";

        await createPageRoutes(routes, async ({ name }) => {
          const endpoint = name === "recover/fail" ? "fail" : "ok";
          return () =>
            render(templates[`${frontend}Page${variant}` as never], {
              OK_MESSAGE,
              endpoint,
            });
        });
      });

      tests.push([
        "ok route renders loader data into #app server-side",
        async ({ expect }) => {
          const content = await serverHtml(project, sourceFolder, "recover/ok");
          const $ = load(content);
          expect($("#app").text()).toContain(OK_MESSAGE);
        },
      ]);

      tests.push([
        "failed SSR fetch recovers to a CSR shell carrying the failure marker",
        async ({ expect }) => {
          const content = await serverHtml(
            project,
            sourceFolder,
            "recover/fail",
          );
          const $ = load(content);
          // On a failed SSR fetch the server serves the client template verbatim for CSR takeover,
          // writing a marker script the client reads to know the server punted.
          // The recovered shell does not carry the loader data.
          const scripts = $("script")
            .map((_, el) => $(el).html() ?? "")
            .get()
            .join("\n");
          expect(scripts).toMatch(/ssr failed/i);
          expect($("#app").text()).not.toContain(OK_MESSAGE);
        },
      ]);

      return { tests, teardown };
    };

    testGroups.push({
      name: [frontend, tsq ? "tsq" : "plain"].join(":"),
      createHarness,
    });
  }

  return testGroups;
};

// Raw server HTML - no browser, no hydration wait.
// These assertions are purely about what the server returned for an SSR request.
// On the recovered fail route the server responds 200 with the CSR shell,
// so the default throw-on-error behavior is fine; retry is off for fast failures.
const serverHtml = async (
  project: ProjectSettings,
  sourceFolder: SourceFolder,
  path: string,
) => {
  const base = sourceFolder.config.frontend?.base;

  if (!base) {
    throw new Error("frontend not configured");
  }

  return got(`http://${project.devHost + join(base, path)}`, {
    retry: { limit: 0 },
    timeout: { request: 500 },
  }).text();
};
