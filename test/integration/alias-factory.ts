import type { TestFunction } from "vitest";

import type { BACKENDS } from "@kosmojs/core";

import { createRoutePath } from ".";
import { apiRoutes } from "./@fixtures/generic/routes";
import { setupTestProject } from "./setup";

const aliases: Array<[alias: string, route: keyof typeof apiRoutes]> = [
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

export const createTests = async (backend: keyof typeof BACKENDS) => {
  const project = await setupTestProject(
    { frontend: "random", backend },
    {
      frontend: { ssr: true, ssg: true },
      backend: {
        alias: Object.fromEntries(aliases),
      },
    },
  );

  await project.bootstrapProject();

  await project.createApiRoutes(
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

  const tests: Array<{ name: string; runner: TestFunction }> = [];

  const serverVariants = [
    ["dev server", "csr"],
    ["backend server", "backend"],
    ["ssr server", "ssr"],
    ["dist/run.js server", "ssg"],
  ] as const;

  for (const [name, serverKind] of serverVariants) {
    tests.push({
      name,
      async runner({ expect }) {
        const closeServer = await project.createServer(serverKind);
        try {
          for (const [alias, route] of aliases) {
            for (const params of apiRoutes[route]) {
              const path = createRoutePath(alias, params);
              const { response } = await project.withApiResponse(path);
              expect(JSON.parse(response.body as never)).toEqual({
                route,
                params,
              });
            }
          }
        } finally {
          await closeServer();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      },
    });
  }

  return {
    project,
    aliases,
    tests,
  };
};
