import { describe, expect, test } from "vitest";

import { apiRoutes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

describe("path patterns", async ({ afterAll }) => {
  const {
    //
    bootstrapProject,
    createApiRoutes,
    withApiResponse,
  } = await setupTestProject({ backend: "koa" });

  const teardown = await bootstrapProject(async () => {
    await createApiRoutes(
      Object.keys(apiRoutes).map((name) => {
        return { name };
      }),
      async ({ name }) => {
        return () => {
          return `
          import { defineRoute } from "_/api";
          export default defineRoute(({ GET }) => [
            GET((ctx) => {
              ctx.body = { route: "${name}", params: ctx.validated.params };
            }),
          ]);
        `;
        };
      },
    );
  });

  afterAll(teardown);

  for (const [route, variants] of Object.entries(apiRoutes)) {
    for (const params of variants) {
      test(`${route} | ${JSON.stringify(Object.values(params))}`, async () => {
        const { response } = await withApiResponse([route, params]);
        expect(JSON.parse(response.body as never)).toEqual({ route, params });
      });
    }
  }
});
