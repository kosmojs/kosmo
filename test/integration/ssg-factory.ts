import { load } from "cheerio";
import type { TestFunction } from "vitest";

import type { FRONTENDS } from "@kosmojs/core";
import { pathTokensFactory } from "@kosmojs/lib";

import { routes } from "./@fixtures/generic/routes";
import { setupTestProject } from "./setup";

type TestEntry = {
  route: (typeof routes)[number];
  params: Array<string>;
  name: string;
  runner: TestFunction;
};

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

export const createTestGroups = ({
  frontend,
  template,
  renderModes = ["string", "stream"],
}: {
  frontend: keyof typeof FRONTENDS;
  template: (a: {
    name: string;
    paramsVariants: Array<Array<unknown>>;
  }) => string;
  renderModes?: Array<"string" | "stream">;
}) => {
  const testGroups: Array<TestGroup> = [];

  for (const renderMode of renderModes) {
    const createHarness = async () => {
      const {
        //
        bootstrapProject,
        createPageRoutes,
        withPageResponse,
      } = await setupTestProject(
        { frontend },
        {
          frontend: {
            ssr: { renderMode },
          },
        },
      );

      const teardown = await bootstrapProject(async () => {
        await createPageRoutes([...routes], async ({ name }) => {
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
                    return part.type === "param"
                      ? part.kind === "required"
                      : false;
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
      });

      const tests = routes.map((route) => {
        const runner: TestFunction = async ({ expect }) => {
          const { response } = await withPageResponse([
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

      return { tests, teardown };
    };

    testGroups.push({
      name: [frontend, renderMode].join(":"),
      createHarness,
    });
  }

  return testGroups;
};
