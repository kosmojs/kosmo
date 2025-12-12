import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { defaults } from "@kosmojs/devlib";

import { apiRoutes, setupTestProject, snapshotNameFor } from "../setup";

const {
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject();

beforeAll(startServer);
afterAll(teardown);

describe("API - useWrappers", async () => {
  await bootstrapProject();

  await createApiRoutes(apiRoutes, async ({ name, file }) => {
    return () => {
      if (file === "use") {
        return `
          import { use } from "@kosmojs/api";
          export default use([
            async (ctx, next) => {
              if (!ctx.state.stack) {
                ctx.state.stack = []
              }
              ctx.state.stack.push("${name}/${file}");
              return next();
            },
          ]);
        `;
      }
      return `
        import { defineRoute } from "${sourceFolder}/${defaults.apiLibDir}/${name}";
        export default defineRoute(({ GET }) => [
          GET(async (ctx) => {
            ctx.state.stack?.push("${name}/${file}");
            ctx.body = ctx.state.stack || [ "${name}/${file}" ];
          }),
        ]);
      `;
    };
  });

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
