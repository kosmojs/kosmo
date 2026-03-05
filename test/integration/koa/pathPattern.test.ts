import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { pathResolver } from "@kosmojs/dev";

import { apiRoutes, setupTestProject } from "../setup";

const {
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({ backend: "koa" });

const { createImport } = pathResolver({ sourceFolder });

beforeAll(async () => {
  await bootstrapProject();

  await createApiRoutes(
    Object.keys(apiRoutes).map((name) => {
      return { name };
    }),
    async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi(name)}";
          export default defineRoute(({ GET }) => [
            GET((ctx) => {
              ctx.body = { route: "${name}", params: ctx.validated.params };
            }),
          ]);
        `;
      };
    },
  );

  await startServer();
});

afterAll(teardown);

describe("API - pathPattern", async () => {
  for (const [route, variants] of Object.entries(apiRoutes)) {
    for (const params of variants) {
      test(`${route} | ${JSON.stringify(Object.values(params))}`, async () => {
        await withApiResponse(route, params, ({ response }) => {
          expect(JSON.parse(response.body as never)).toEqual({ route, params });
        });
      });
    }
  }
});
