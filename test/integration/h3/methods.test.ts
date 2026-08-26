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
    methods.map((name) => {
      return { name };
    }),
    async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi([], { origin: "src" })}";
          export default defineRoute(({ ${name} }) => [
            ${name}(() => {
              return { method: "${name}" };
            }),
          ]);
        `;
      };
    },
  );

  await startServer();
});

afterAll(teardown);

describe("methods", async () => {
  for (const method of methods as Array<never>) {
    test(`${method}: 200`, async () => {
      const { response } = await withApiResponse(method, { method });
      expect(response.statusCode).toEqual(200);
      if (method !== "HEAD") {
        expect(JSON.parse(response.body)).toEqual({ method });
      }
    });

    const otherMethods = methods.filter((e) => e !== method) as Array<never>;

    for (const otherMethod of otherMethods) {
      if (otherMethod === "OPTIONS") {
        test(`${method}: 204 on ${otherMethod}`, async () => {
          const { response } = await withApiResponse(method, {
            method: otherMethod,
          });
          expect(response.statusCode).toEqual(204);
          expect(response.headers.allow).toContain(method);
        });
      } else if (otherMethod === "HEAD" && method === "GET") {
        test(`${method}: 200 on ${otherMethod}`, async () => {
          const { response } = await withApiResponse(method, {
            method: otherMethod,
          });
          expect(response.statusCode).toEqual(200);
        });
      } else {
        test(`${method}: 405 on ${otherMethod}`, async () => {
          const error = await withApiResponse(method, {
            method: otherMethod,
          }).catch((e) => e);
          expect(error.message).toMatch("405 (Method Not Allowed)");
          expect(error.response.headers.allow).toContain(method);
        });
      }
    }
  }
});
