import { describe, expect, test } from "vitest";

import { apiRoutes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

describe("path patterns", async ({ afterAll }) => {
  const { bootstrapProject, createApiRoutes, withApiResponse } =
    await setupTestProject({ backend: "h3" });

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
            GET((event) => {
              return { route: "${name}", params: event.validated.params };
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
      test(`${route} | ${JSON.stringify(Object.values(params))}`, {
        skip: (
          [
            // NOTE: skip mixed and power syntax segements, not suported by h3
            ["v1/products/book-[id]/{{:category-}reviews}", []],
            ["products/{...path}.[ext]", []],
            ["locale{-:lang{-:country}}", []],
            ["book{-:id}-info", []],
            ["item-[id]{-:color}{.:format}", []],
            ["files/[name]{@:version{.:min}}.js", []],
            ["files/report{.:format}", []],
            ["archive{.:format}{-:compression}", []],
            ["app/[name]{-v:version{-:pre}}", []],
            [
              // NOTE: "search/a" and "search/a/b" matches, "search" does not
              "search/{query}/{page}",
              [{}],
            ],
          ] as const
        ).some(([_route, _variants]) => {
          return _route === route
            ? _variants.length
              ? _variants.some(
                  (e) => JSON.stringify(e) === JSON.stringify(params),
                )
              : true
            : false;
        }),
      }, async () => {
        const { response } = await withApiResponse([route, params]);
        expect(JSON.parse(response.body as never)).toEqual({ route, params });
      });
    }
  }
});
