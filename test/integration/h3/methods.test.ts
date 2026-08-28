import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { HTTPMethods } from "@kosmojs/core/api";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

const {
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({
  backend: "h3",
});

const { createImport } = pathResolver(sourceFolder);

const methods = Object.keys(HTTPMethods);

beforeAll(async () => {
  await bootstrapProject();

  await createApiRoutes(
    methods.flatMap((method) => {
      return method === "HEAD" // HEAD handlers wired automatically
        ? []
        : [{ name: method }];
    }),
    async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi([], { origin: "src" })}";
          export default defineRoute(({ ${name} }) => [
            ${name}<{ query: { page?: number } }>((e) => {
              return { method: "${name}", page: e.validated.query.page };
            }),
          ]);
        `;
      };
    },
  );

  await startServer();
});

afterAll(teardown);

for (const method of methods as Array<never>) {
  describe(method, { skip: method === "HEAD" }, async () => {
    test("200", async () => {
      const { response } = await withApiResponse(method, { method });
      expect(response.statusCode).toEqual(200);
    });

    const otherMethods = methods.filter((e) => e !== method) as Array<never>;

    for (const otherMethod of otherMethods) {
      if (otherMethod === "OPTIONS") {
        test(`204 on ${otherMethod}`, async () => {
          const { response } = await withApiResponse(method, {
            method: otherMethod,
          });
          expect(response.statusCode).toEqual(204);
          expect(response.headers.allow).toContain(method);
        });
      } else if (otherMethod === "HEAD" && method === "GET") {
        test(`200 on ${otherMethod} with valid page`, async () => {
          const { response } = await withApiResponse(method, {
            method: otherMethod,
            searchParams: { page: "1" },
          });
          expect(response.statusCode).toEqual(200);
        });
        test(`400 on ${otherMethod} with wrong page`, async () => {
          const error = await withApiResponse(method, {
            method: otherMethod,
            searchParams: { page: "x" },
          }).catch((e) => e);
          expect(error.message).toMatch("400 (Bad Request)");
        });
      } else {
        test(`405 on ${otherMethod}`, async () => {
          const error = await withApiResponse(method, {
            method: otherMethod,
          }).catch((e) => e);
          expect(error.message).toMatch("405 (Method Not Allowed)");
          expect(error.response.headers.allow).toContain(method);
        });
      }
    }
  });
}
