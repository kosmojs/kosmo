import type { TestFunction } from "vitest";

import type { BACKENDS } from "@kosmojs/core";

import { compileRoutePath } from ".";
import { apiRoutes } from "./@fixtures/generic/routes";
import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

export const aliases: Array<[alias: string, route: keyof typeof apiRoutes]> = [
  ["/api/admin-resources/[tenant]/{type}", "admin/[tenant]/resources/{type}"],
  ["/member/[id]", "user_[id]"],
  ["/file-manager/{...dir}/[name]", "files/{...dir}/[name]"],
  ["/books/info/{id}", "book{-:id}-info"],
  [
    "/articles/[category]/{...articlePath}",
    "news/[category]/articles/{...articlePath}",
  ],
  ["/log/[day]/[month]/[year]", "logs/[year]-[month]-[day]"],
  ["/changelog/[version]", "changelog/v[version].html"],
];

export const createTestGroups = (backend: keyof typeof BACKENDS) => {
  const testGroups: Array<TestGroup> = [];

  const serverVariants = [
    ["dev server", "csr"],
    ["backend server", "backend"],
    ["ssr server", "ssr"],
    ["dist/run.js server", "ssg"],
  ] as const;

  for (const [name, mode] of serverVariants) {
    const createHarness = async () => {
      const {
        //
        bootstrapProject,
        createApiRoutes,
        withApiResponse,
      } = await setupTestProject(
        { frontend: "random", backend, mode },
        {
          frontend: { ssr: true, ssg: true },
          backend: {
            alias: Object.fromEntries(aliases),
          },
        },
      );

      const teardown = await bootstrapProject(async () => {
        await createApiRoutes(
          Object.keys(apiRoutes).map((name) => {
            return { name };
          }),
          async ({ name }) => {
            return () => {
              const response = `{ route: "${name}", params: ctx.validated.params }`;
              const responseSetter = {
                h3: `return ${response}`,
                hono: `return ctx.json(${response})`,
                koa: `ctx.body = ${response}`,
              }[backend];
              return `
                import { defineRoute } from "_/api";
                export default defineRoute(({ GET }) => [
                  GET((ctx) => {
                    ${responseSetter}
                  }),
                ]);
              `;
            };
          },
        );
      });

      const tests: Array<TestEntry> = [];

      for (const [alias, route] of aliases) {
        for (const params of apiRoutes[route]) {
          tests.push([
            [alias, JSON.stringify(Object.values(params))].join(" | "),
            async ({ expect }) => {
              const path = compileRoutePath(alias, params);
              const { response } = await withApiResponse(`/${path}`);
              expect(JSON.parse(response.body as never)).toEqual({
                route,
                params,
              });
            },
          ]);
        }
      }

      return { tests, teardown };
    };

    testGroups.push({ name, createHarness });
  }

  return testGroups;
};
