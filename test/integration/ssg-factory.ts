import { load } from "cheerio";
import type { TestFunction } from "vitest";

import type { FRAMEWORKS } from "@kosmojs/core";
import { pathTokensFactory } from "@kosmojs/lib";

import { routes } from "./@fixtures/generic/routes";
import { setupTestProject } from "./setup";

export type TestGroup = {
  name: string;
  project: Awaited<ReturnType<typeof setupTestProject>>;
  tests: Array<{
    route: (typeof routes)[number];
    params: Array<string>;
    name: string;
    runner: TestFunction;
  }>;
};

export const createTestGroups = async ({
  framework,
  template,
  renderModes = ["string", "stream"],
}: {
  framework: keyof typeof FRAMEWORKS;
  template: (a: {
    name: string;
    paramsVariants: Array<Array<unknown>>;
  }) => string;
  renderModes?: Array<"string" | "stream">;
}) => {
  const testGroups: Array<TestGroup> = [];

  for (const renderMode of renderModes) {
    const project = await setupTestProject({
      framework,
      ssr: { renderMode },
    });

    await project.bootstrapProject();

    await project.createPageRoutes([...routes], async ({ name }) => {
      return () => {
        const variants = routes.filter((e) => e.name === name);
        if (!variants.length) {
          return "";
        }

        const paramsVariants = variants.flatMap(({ params }) => {
          const values = Object.values(params);
          return values.length ? [values] : [];
        });

        if (paramsVariants.length) {
          const tokens = pathTokensFactory(name);
          if (
            !tokens.some(({ parts }) => {
              return parts.some((part) => {
                return part.type === "param" ? part.kind === "required" : false;
              });
            })
          ) {
            // there are params but none required, adding a variant with zero params
            paramsVariants.push([]);
          }
        }

        return template({ name, paramsVariants });
      };
    });

    const tests = routes.map((route) => {
      const runner: TestFunction = async ({ expect }) => {
        const { response } = await project.withPageResponse([
          route.name,
          route.params,
        ]);
        const $ = load(response.body);
        const content = $(`#content`).text();
        expect(content).toMatch(route.name);
      };

      const params = Object.values(route.params);

      return {
        route,
        params,
        name: params.length
          ? `${route.name}: [ ${params.join(", ")} ]`
          : route.name,
        runner,
      };
    });

    testGroups.push({
      name: [framework, renderMode].join(":"),
      project,
      tests,
    });
  }

  return testGroups;
};
