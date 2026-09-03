import { join } from "node:path";

import { load } from "cheerio";
import got from "got";
import { inject, type TestFunction } from "vitest";

import type { FRAMEWORKS } from "@kosmojs/core";
import { render } from "@kosmojs/lib";

import * as templates from "./@fixtures/error-recovery/templates";
import { setupTestProject } from "./setup";

export type TestGroup = {
  name: string;
  project: Awaited<ReturnType<typeof setupTestProject>>;
  tests: Array<[path: string, runner: TestFunction]>;
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

export const createTestGroups = async ({
  framework,
  tsqModes = framework === "mdx" // no tanstack query on mdx
    ? [false]
    : [false, true],
}: {
  framework: keyof typeof FRAMEWORKS;
  tsqModes?: Array<boolean>;
}) => {
  const testGroups: Array<TestGroup> = [];

  for (const tsq of tsqModes) {
    const project = await setupTestProject({
      framework,
      backend: "hono",
      tsq,
      skip,
      ssr: { renderMode: "string" },
    });

    const group: TestGroup = {
      name: [framework, tsq ? "tsq" : "plain"].join(":"),
      project,
      tests: [],
    };

    testGroups.push(group);

    if (skip) {
      continue;
    }

    const { bootstrapProject, createApiRoutes, createPageRoutes } = project;

    await bootstrapProject();

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
        render(templates[`${framework}Page${variant}` as never], {
          OK_MESSAGE,
          endpoint,
        });
    });

    group.tests.push([
      "ok route renders loader data into #app server-side",
      async ({ expect }) => {
        const content = await serverHtml(project, "recover/ok");
        const $ = load(content);
        expect($("#app").text()).toContain(OK_MESSAGE);
      },
    ]);

    group.tests.push([
      "failed SSR fetch recovers to a CSR shell carrying the failure marker",
      async ({ expect }) => {
        const content = await serverHtml(project, "recover/fail");
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
  }

  return testGroups;
};

// Raw server HTML - no browser, no hydration wait.
// These assertions are purely about what the server returned for an SSR request.
// On the recovered fail route the server responds 200 with the CSR shell,
// so the default throw-on-error behavior is fine; retry is off for fast failures.
const serverHtml = async (
  project: Awaited<ReturnType<typeof setupTestProject>>,
  path: string,
) => {
  return got(project.baseURL + join(project.sourceFolder.config.base, path), {
    retry: { limit: 0 },
    timeout: { request: 500 },
  }).text();
};
