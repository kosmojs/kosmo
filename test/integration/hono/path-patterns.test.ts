import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { apiRoutes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

const {
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({
  backend: "hono",
});

beforeAll(async () => {
  await bootstrapProject();

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
              return ctx.json({ route: "${name}", params: ctx.validated.params });
            }),
          ]);
        `;
      };
    },
  );

  await startServer();
});

afterAll(teardown);

describe("path patterns", async () => {
  for (const [route, variants] of Object.entries(apiRoutes)) {
    for (const params of variants) {
      test(`${route} | ${JSON.stringify(Object.values(params))}`, async () => {
        const { response } = await withApiResponse([route, params]);
        expect(JSON.parse(response.body as never)).toEqual({ route, params });
      });
    }
  }
});
