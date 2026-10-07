import { describe, expect, test } from "vitest";

import { routes } from "../@fixtures/cascading-middleware";
import { setupTestProject } from "../setup";

describe("cascading middleware", async ({ afterAll }) => {
  const {
    //
    bootstrapProject,
    createApiRoutes,
    withApiResponse,
  } = await setupTestProject({ backend: "hono" });

  const teardown = await bootstrapProject(async () => {
    await createApiRoutes(routes, async ({ name, file }) => {
      return () => {
        if (file === "use") {
          return `
              import { use } from "_/api";
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
            import { defineRoute } from "_/api";
            export default defineRoute<"${name}">(({ GET }) => [
              GET(async (ctx) => {
                return ctx.json([ ...ctx.var.stack, "${name}/index" ]);
              }),
            ]);
          `;
      };
    });
  });

  afterAll(teardown);

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
