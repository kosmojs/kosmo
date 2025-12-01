import { Spectral } from "@stoplight/spectral-core";
import { oas } from "@stoplight/spectral-rulesets";
import { describe, expect, test } from "vitest";

import routesFactory from "@kosmojs/dev/routes";
import type { ApiRoute } from "@kosmojs/devlib";

import openapiFactory from "@/openapi";

import { openapiOptions, resolvedOptions } from ".";

describe("openapi", async () => {
  const { resolvers } = await routesFactory(resolvedOptions);

  const { generateOpenAPISchema } = openapiFactory(resolvedOptions);

  const apiRoutes: ApiRoute[] = [];

  for (const { handler } of resolvers.values()) {
    const { kind, entry } = await handler();
    if (kind === "apiRoute") {
      apiRoutes.push(entry);
    }
  }

  test("lint", async () => {
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

    const { paths, components } = generateOpenAPISchema(apiRoutes);

    const diagnostics = await spectral.run({
      ...openapiOptions,
      paths,
      components,
    });

    expect(diagnostics.length, JSON.stringify(diagnostics, null, 2)).toEqual(0);
  });

  for (const route of apiRoutes) {
    test(route.name, async ({ expect }) => {
      await expect(generateOpenAPISchema([route])).toMatchFileSnapshot(
        `snapshots/${route.name}/openapi.txt`,
      );
    });
  }
});
