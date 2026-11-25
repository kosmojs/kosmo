import { join } from "node:path";

import got from "got";
import { inject, type TestFunction } from "vitest";

import type { FRONTENDS } from "@kosmojs/core";

import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

// A redirect becomes a 3xx only when the server renders, so the suite only runs under SSR.
export const skip = inject("MODE") !== "ssr";

type Frontend = Exclude<keyof typeof FRONTENDS, "mdx">;

const TARGET_ROUTE = "redirect/target";
const TARGET_MARKER = "redirect-target-page";

/**
 * Each framework's own way to redirect while a page resolves on the server:
 * - react: React Router's `redirect()`, thrown from the route loader;
 * - solid: Solid Router's `redirect()`, returned by a `query`, and `<Navigate>`;
 * - vue: a Response thrown from the page loader, and a navigation guard returning another location;
 * - svelte: a Response thrown from the page loader.
 * `location` is the path to redirect to, as the framework takes it:
 * a router resolves it against its own base, a thrown Response carries it as is.
 * */
const redirectPages: Record<
  Frontend,
  Record<string, (location: string, status: number) => string>
> = {
  react: {
    loader: (location, status) => `
      import { redirect } from "react-router";
      export const loader = () => {
        throw redirect(${JSON.stringify(location)}, ${status});
      };
      export default function Page() {
        return <div>redirect source</div>;
      }
    `,
  },
  solid: {
    query: (location, status) => `
      import { Suspense } from "solid-js";
      import { createAsync, query, redirect } from "@solidjs/router";
      const getData = query(async () => {
        throw redirect(${JSON.stringify(location)}, ${status});
      }, "redirect-source");
      export default function Page() {
        const data = createAsync(() => getData());
        return <Suspense><div>{String(data())}</div></Suspense>;
      }
    `,
    navigate: (location) => `
      import { Navigate } from "@solidjs/router";
      export default function Page() {
        return <Navigate href={${JSON.stringify(location)}} />;
      }
    `,
  },
  vue: {
    loader: (location, status) => `
      <script lang="ts">
      export const loader = () => {
        throw new Response(null, {
          status: ${status},
          headers: { Location: ${JSON.stringify(location)} },
        });
      };
      </script>
      <script setup lang="ts">
      const label = "redirect source";
      </script>
      <template><div>{{ label }}</div></template>
    `,
    guard: (location) => `
      <script lang="ts">
      export default {
        beforeRouteEnter() {
          return ${JSON.stringify(location)};
        },
      };
      </script>
      <template><div>redirect source</div></template>
    `,
  },
  svelte: {
    loader: (location, status) => `
      <script module lang="ts">
      export const loader = () => {
        throw new Response(null, {
          status: ${status},
          headers: { Location: ${JSON.stringify(location)} },
        });
      };
      </script>
      <div>redirect source</div>
    `,
  },
};

const targetPages: Record<Frontend, string> = {
  react: `export default function Page() { return <div>${TARGET_MARKER}</div>; }`,
  solid: `export default function Page() { return <div>${TARGET_MARKER}</div>; }`,
  vue: `<template><div>${TARGET_MARKER}</div></template>`,
  svelte: `<div>${TARGET_MARKER}</div>`,
};

/**
 * Statuses each way is checked with.
 * On the server, Solid Router answers every redirect with a 302:
 * `<Navigate>` takes no status, and a `query` redirect goes through the same navigation,
 * dropping the status given to `redirect()`.
 * A Vue navigation guard returns a location, with no status, so it is a 302 as well.
 * */
const statusesFor = (frontend: Frontend, way: string) => {
  return frontend === "solid" || way === "guard" ? [302] : [302, 301, 307];
};

// a router resolves a path against its own base; a thrown Response carries it as given
const routerRelative = (frontend: Frontend, way: string) => {
  return frontend === "react" || frontend === "solid" || way === "guard";
};

// svelte/server has no stream renderer
const renderModesFor = (frontend: Frontend) => {
  return frontend === "svelte"
    ? (["string"] as const)
    : (["string", "stream"] as const);
};

export const createTestGroups = (frontend: Frontend) => {
  return renderModesFor(frontend).map((renderMode): TestGroup => {
    const createHarness = async () => {
      const { project, sourceFolder, bootstrapProject, createPageRoutes } =
        await setupTestProject(
          { frontend, backend: "hono", skip },
          { frontend: { ssr: { renderMode } } },
        );

      const base = sourceFolder.config.frontend?.base ?? "/";
      const targetPath = join(base, TARGET_ROUTE);

      const cases = Object.keys(redirectPages[frontend]).flatMap((way) => {
        return statusesFor(frontend, way).map((status) => {
          return { way, status, route: `redirect/${way}-${status}` };
        });
      });

      const teardown = await bootstrapProject(async () => {
        await createPageRoutes([{ name: TARGET_ROUTE }], async () => {
          return () => targetPages[frontend];
        });
        await createPageRoutes(
          cases.map(({ route }) => ({ name: route })),
          async ({ name }) => {
            const { way, status } = cases.find((e) => e.route === name) ?? {};
            return () =>
              redirectPages[frontend][way as string](
                routerRelative(frontend, way as string)
                  ? `/${TARGET_ROUTE}`
                  : targetPath,
                status as number,
              );
          },
        );
      });

      const request = (path: string) => {
        return got(`http://${project.devHost}${join(base, path)}`, {
          followRedirect: false,
          throwHttpErrors: false,
          retry: { limit: 0 },
        });
      };

      const tests: Array<TestEntry> = [
        [
          "the redirect target renders",
          async ({ expect }) => {
            const response = await request(TARGET_ROUTE);
            expect(response.statusCode).toEqual(200);
            expect(response.body).toContain(TARGET_MARKER);
          },
        ],

        ...cases.map(({ way, status, route }): TestEntry => {
          return [
            `${way}: responds with a ${status} to the target`,
            async ({ expect }) => {
              const response = await request(route);
              expect(
                [response.statusCode, response.headers.location],
                response.body.slice(0, 300),
              ).toEqual([status, targetPath]);
            },
          ];
        }),
      ];

      return { tests, teardown };
    };

    return { name: `${frontend}: ${renderMode} render`, createHarness };
  });
};
