import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { pathResolver } from "@kosmojs/dev";

import { apiRoutes, setupTestProject, snapshotNameFor } from "../setup";

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

  await createApiRoutes(apiRoutes, async ({ name, file }) => {
    return () => {
      if (file === "use") {
        return `
          import { use } from "@kosmojs/api";
          export default [
            use((ctx, next) => {
              if (!ctx.state.stack) {
                ctx.state.stack = []
              }
              ctx.state.stack.push("${name}/${file}");
              return next();
            }),
          ];
        `;
      }
      return `
        import { defineRoute } from "${createImport.libApi(name)}";
        export default defineRoute(({ GET }) => [
          GET(async (ctx) => {
            ctx.state.stack?.push("${name}/${file}");
            ctx.body = ctx.state.stack || [ "${name}/${file}" ];
          }),
        ]);
      `;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("API - useWrappers", async () => {
  for (const { name, params } of apiRoutes.filter(
    ({ file }) => file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      await withApiResponse(name, params, async ({ response }) => {
        await expect(response.body).toMatchFileSnapshot(
          `@snapshots/useWrappers/${snapshotName}.json`,
        );
      });
    });
  }
});
