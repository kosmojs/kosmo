import { load } from "cheerio";
import { inject, type TestFunction } from "vitest";

import type { FRAMEWORKS } from "@kosmojs/core";
import { pathResolver, render, renderToFile } from "@kosmojs/lib";

import * as templates from "./@fixtures/error-boundary/templates";
import { setupTestProject } from "./setup";

const mode = inject("MODE");

// Error boundaries catch on the client in every framework; on the server the
// behavior diverges by framework, so these assertions only hold under CSR.
export const skip = mode !== "csr";

const BOUNDARY_MESSAGE = "BOUNDARY_CAUGHT_ERROR";
const THROW_MESSAGE = "page exploded on purpose";

const routes = [
  { name: "guarded", file: "layout", params: {} },
  { name: "guarded/boom", file: "index", params: {} },
  { name: "guarded/ok", file: "index", params: {} },
];

export const createTestSuite = async ({
  framework,
}: {
  framework: keyof typeof FRAMEWORKS;
}) => {
  const project = await setupTestProject({
    framework,
    skip,
  });

  if (!skip) {
    const { sourceFolder, bootstrapProject, createPageRoutes } = project;
    const { createPath } = pathResolver(sourceFolder);

    await bootstrapProject();

    await createPageRoutes(routes, async ({ name, file }) => {
      const context = {
        BOUNDARY_MESSAGE,
        THROW_MESSAGE,
      };
      if (framework === "mdx") {
        await renderToFile(
          createPath.src("ErrorBoundary.tsx"),
          templates.mdxWrapper,
          context,
        );
      }
      if (file === "layout") {
        return () => render(templates[`${framework}Layout`], context);
      }
      if (name === "guarded/boom") {
        return () => render(templates[`${framework}Boom`], context);
      }
      return () => render(templates[`${framework}Ok`], context);
    });
  }

  const tests: Array<[name: string, runner: TestFunction]> = [
    [
      "layout boundary catches a throwing child route",
      async ({ expect }) => {
        const { content } = await project.withPageContent(["guarded/boom"]);
        const $ = load(content);
        expect($("[data-boundary]").text()).toContain(BOUNDARY_MESSAGE);
        expect(content).not.toContain(THROW_MESSAGE);
      },
    ],

    [
      "a non-throwing child renders normally under the same layout",
      async ({ expect }) => {
        const { content } = await project.withPageContent(["guarded/ok"]);
        const $ = load(content);
        expect($("[data-ok]").text()).toContain("ok");
        expect($("[data-boundary]").length).toBe(0);
      },
    ],
  ];

  return {
    project,
    tests,
  };
};
