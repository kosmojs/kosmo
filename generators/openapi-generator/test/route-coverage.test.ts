import { join } from "node:path";

import { parse, type Token } from "path-to-regexp";
import { test } from "vitest";

import type { ApiRoute } from "@kosmojs/core";
import { routesFactory } from "@kosmojs/lib";

import openapiFactory from "#/openapi";

import { sourceFolder } from ".";

/**
 * Positive route-coverage guard.
 *
 * Derives each api route's CANONICAL OpenAPI path - the variation where every
 * param is present, i.e. the longest one - and asserts it is a key in the
 * emitted `paths`. A route silently dropped by the subsumption pruning fails
 * here loudly and names itself, which a snapshot (asserting only "same as last
 * time") cannot do once a wrong output has been committed.
 * */
function canonicalPath(pathPattern: string): string {
  const render = (tokens: Array<Token>): string =>
    tokens
      .map((token) => {
        switch (token.type) {
          case "text":
            return token.value;
          case "param":
            return `{${token.name}}`;
          case "wildcard":
            return `{${token.name}*}`;
          default:
            // canonical = every optional group included
            return render(token.tokens);
        }
      })
      .join("");

  return join("/", render(parse(pathPattern).tokens).replace(/^\/+/, ""));
}

test("every api route contributes its canonical path", async ({ expect }) => {
  const { resolvers } = await routesFactory(sourceFolder);

  const apiRoutes: Array<ApiRoute> = [];

  for (const { handler } of resolvers.values()) {
    const { kind, entry } = await handler();
    if (kind === "apiRoute") {
      apiRoutes.push(entry);
    }
  }

  const { generateOpenAPISchema } = openapiFactory();

  const emitted = new Set(Object.keys(generateOpenAPISchema(apiRoutes).paths));

  expect(emitted.size).toBeGreaterThanOrEqual(apiRoutes.length);

  const missing = apiRoutes.flatMap(({ name, pathPattern }) => {
    return emitted.has(name === "index" ? "/" : canonicalPath(pathPattern))
      ? []
      : [name];
  });

  expect(missing).toEqual([]);
});
