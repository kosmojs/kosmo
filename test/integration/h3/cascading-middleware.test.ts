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
  backend: "h3",
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
            use<UseT>((event, next) => {
              if (!event.context.stack) {
                event.context.stack = [];
              }
              event.context.stack.push("${name}/use");
              return next();
            }),
          ];
        `;
      }
      return `
        import { defineRoute } from "${defaults.libPrefix}/api";
        export default defineRoute<"${name}">(({ GET }) => [
          GET(async (event) => {
            return [ ...event.context.stack, "${name}/index" ];
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
