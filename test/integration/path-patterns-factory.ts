import { rm } from "node:fs/promises";

import type { TestFunction } from "vitest";

import { type BACKENDS, join } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { compileRoutePath } from ".";
import { apiRoutes } from "./@fixtures/generic/routes";
import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

type Variants = ReadonlyArray<Record<string, string | ReadonlyArray<string>>>;

type Project = {
  name: string;
  routes: Record<string, Variants>;
  // absolute alias -> route; requested with the route's own params
  aliases?: Array<[alias: string, route: string]>;
  // drop the seeded index route, which would otherwise answer the base path itself
  withoutIndex?: boolean;
};

// patterns h3's router cannot express
const h3Exclude: Array<string> = [
  "v1/products/book-[id]/{{:category-}reviews}",
  "products/{...path}.[ext]",
  "locale{-:lang{-:country}}",
  "book{-:id}-info",
  "item-[id]{-:color}{.:format}",
  "files/[name]{@:version{.:min}}.js",
  "files/report{.:format}",
  "archive{.:format}{-:compression}",
  "app/[name]{-v:version{-:pre}}",
  "search/{query}/{page}",
  "file-manager/{...before}/static/{...after}",
  "blog/{category}/{...page}",
];

/**
 * Routes whose pattern starts with an optional or splat group, `{/:locale}` or `{/*rest}`.
 * Joined onto the backend base, that group must attach without a slash of its own:
 * `/api{/:locale}` matches `/api` and `/api/en`, `/api/{/:locale}` matches neither.
 * Each gets a project of its own, since a root-level group claims every path beneath the base,
 * and none keeps the index route, which would claim the base path the empty variants request.
 * */
const rootLevelProjects: Array<Project> = [
  {
    name: "root-level optional",
    routes: { "{locale}": [{}, { locale: "en" }] },
    aliases: [["/{locale}/home", "{locale}"]],
    withoutIndex: true,
  },
  {
    name: "root-level splat",
    routes: {
      "{...rest}": [{}, { rest: ["guides"] }, { rest: ["guides", "intro"] }],
    },
    withoutIndex: true,
  },
  {
    name: "root-level optional before a static segment",
    routes: { "{locale}/about": [{}, { locale: "en" }] },
    withoutIndex: true,
  },
];

/**
 * Requests hono's and h3's routers cannot match, keyed by test name.
 * Their native patterns can leave out an optional segment only when it comes last,
 * so hono's `:locale?/about`, and h3's wildcard before `/about`, need the locale present.
 * Skipped rather than dropped, so they stay visible in every run.
 * */
const unsupported: Partial<Record<keyof typeof BACKENDS, Array<string>>> = {
  hono: ["{locale}/about | []", "alias /{locale}/home | []"],
  h3: ["{locale}/about | []", "alias /{locale}/home | []"],
};

const responseSetters: Record<keyof typeof BACKENDS, (body: string) => string> =
  {
    h3: (body) => `return ${body}`,
    hono: (body) => `return ctx.json(${body})`,
    koa: (body) => `ctx.body = ${body}`,
  };

export const createTestGroups = (backend: keyof typeof BACKENDS) => {
  const exclude = backend === "h3" ? h3Exclude : [];

  const projects: Array<Project> = [
    {
      name: "generic routes",
      routes: Object.fromEntries(
        Object.entries(apiRoutes).filter(([name]) => !exclude.includes(name)),
      ),
    },
    ...rootLevelProjects,
  ];

  const skipUnsupported = (testName: string, skip: (note: string) => void) => {
    if (unsupported[backend]?.includes(testName)) {
      skip(`${backend} router cannot leave out a non-final optional segment`);
    }
  };

  return projects.map((project): TestGroup => {
    const { name, routes, aliases = [], withoutIndex } = project;

    const createHarness = async () => {
      const {
        //
        project: projectSettings,
        sourceFolder,
        bootstrapProject,
        createApiRoutes,
        withApiResponse,
      } = await setupTestProject(
        { backend },
        aliases.length
          ? { backend: { alias: Object.fromEntries(aliases) } }
          : undefined,
      );

      const teardown = await bootstrapProject(async () => {
        if (withoutIndex) {
          const { createPath } = pathResolver(projectSettings, sourceFolder);
          await rm(createPath.api("index"), { recursive: true, force: true });
        }
        await createApiRoutes(
          Object.keys(routes).map((name) => ({ name })),
          async ({ name }) => {
            const body = `{ route: "${name}", params: ctx.validated.params }`;
            return () => `
              import { defineRoute } from "_/api";
              export default defineRoute(({ GET }) => [
                GET((ctx) => {
                  ${responseSetters[backend](body)}
                }),
              ]);
            `;
          },
        );
      });

      const tests: Array<TestEntry> = [];

      for (const [route, variants] of Object.entries(routes)) {
        for (const params of variants) {
          const testName = [route, JSON.stringify(Object.values(params))].join(
            " | ",
          );
          tests.push([
            testName,
            async ({ expect, skip }) => {
              skipUnsupported(testName, skip);
              const { response } = await withApiResponse([route, params]);
              expect(response.statusCode, response.body as string).toBe(200);
              expect(JSON.parse(response.body as never)).toEqual({
                route,
                params,
              });
            },
          ]);
        }
      }

      for (const [alias, route] of aliases) {
        for (const params of routes[route]) {
          const testName = [
            `alias ${alias}`,
            JSON.stringify(Object.values(params)),
          ].join(" | ");
          tests.push([
            testName,
            async ({ expect, skip }) => {
              skipUnsupported(testName, skip);
              // join, not a "/" prefix: an optional-first alias compiles with its own slash
              const path = join("/", compileRoutePath(alias, params));
              const { response } = await withApiResponse(path);
              expect(response.statusCode, response.body as string).toBe(200);
              expect(JSON.parse(response.body as never)).toEqual({
                route,
                params,
              });
            },
          ]);
        }
      }

      return { tests, teardown };
    };

    return { name: `${backend}: ${name}`, createHarness };
  });
};
