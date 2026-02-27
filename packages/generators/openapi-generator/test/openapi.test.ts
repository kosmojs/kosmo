import { Spectral } from "@stoplight/spectral-core";
import { oas } from "@stoplight/spectral-rulesets";
import { test } from "vitest";

import { type ApiRoute, routesFactory } from "@kosmojs/dev";

import { openapiOptions, resolvedOptions } from ".";

import openapiFactory from "@src/openapi";

test("openapi", async ({ expect }) => {
  const { resolvers } = await routesFactory(resolvedOptions);

  const { generateOpenAPISchema } = openapiFactory(resolvedOptions);

  const apiRoutes: ApiRoute[] = [];

  for (const { handler } of resolvers.values()) {
    const { kind, entry } = await handler();
    if (kind === "apiRoute") {
      apiRoutes.push(entry);
    }
  }

  const { paths, components } = generateOpenAPISchema(apiRoutes);

  await expect(
    JSON.stringify({ paths, components }, null, 2),
  ).toMatchFileSnapshot(`@snapshots/openapi.json`);

  const spectral = new Spectral();

  spectral.setRuleset({
    extends: [oas as never],
    rules: {
      "operation-description": "off",
      "operation-operationId": "off",
      "operation-tags": "off",
      "info-description": "off",
      "info-contact": "off",
    },
  });

  const diagnostics = await spectral.run({
    ...openapiOptions,
    paths,
    components,
  });

  expect(diagnostics.length, JSON.stringify(diagnostics, null, 2)).toEqual(0);
});
