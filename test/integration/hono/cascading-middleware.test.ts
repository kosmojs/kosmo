import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { routes } from "../@fixtures/cascading-middleware";
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

  await createApiRoutes(routes, async ({ name, file }) => {
    return () => {
      if (file === "use") {
        return `
          import { use } from "${defaults.libPrefix}/api";
          export type UseT = { stack: Array<string> };
          export default [
            use<UseT>((ctx, next) => {
              if (!ctx.var.stack) {
                ctx.set("stack", []);
              }
              ctx.var.stack.push("${name}/use");
              return next();
            }),
          ];
        `;
      }
      return `
        import { defineRoute } from "${defaults.libPrefix}/api";
        export default defineRoute<"${name}">(({ GET }) => [
          GET(async (ctx) => {
            return ctx.json([ ...ctx.var.stack, "${name}/index" ]);
          }),
        ]);
      `;
    };
  });

  await startServer();
});

afterAll(teardown);

describe("cascading middleware", async () => {
  for (const route of routes) {
    if (route.file !== "index") {
      continue;
    }
    test(route.name, async () => {
      const { response } = await withApiResponse([route.name, route.params]);
      expect(JSON.parse(response.body)).toEqual(route.use);
    });
  }
});
