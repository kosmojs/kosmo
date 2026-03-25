import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { pathResolver } from "@kosmojs/lib";

import {
  nestedRoutes,
  type RouteName,
  setupTestProject,
  snapshotNameFor,
} from "../setup";

const apiRoutes: Array<{
  name: RouteName;
  file: "index" | "use";
  params: Record<string, unknown>;
}> = nestedRoutes.map(({ file = "index", ...route }) => {
  return {
    ...route,
    file: file === "layout" ? "use" : file,
  };
});

const {
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({ backend: "hono" });

const { createImport } = pathResolver(sourceFolder);

beforeAll(async () => {
  await bootstrapProject();

  await createApiRoutes(apiRoutes, async ({ name, file }) => {
    return () => {
      if (file === "use") {
        return `
          import { use } from "${createImport.libApi()}";
          export default [
            use((ctx, next) => {
              if (!ctx.var.stack) {
                ctx.set("stack", []);
              }
              ctx.var.stack.push("${name}/${file}");
              return next();
            }),
          ];
        `;
      }
      return `
        import { defineRoute } from "${createImport.libApi()}";
        export default defineRoute(({ GET }) => [
          GET(async (ctx) => {
            ctx.var.stack?.push("${name}/${file}");
            return ctx.json(ctx.var.stack || [ "${name}/${file}" ]);
          }),
        ]);
      `;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("cascading middleware", async () => {
  for (const { name, params } of apiRoutes.filter(
    ({ file }) => file === "index",
  )) {
    const snapshotName = snapshotNameFor(name, params);
    test(snapshotName, async () => {
      await withApiResponse(name, params, async ({ response }) => {
        await expect(response.body).toMatchFileSnapshot(
          `../@snapshots/cascading-middleware/${snapshotName}.json`,
        );
      });
    });
  }
});
