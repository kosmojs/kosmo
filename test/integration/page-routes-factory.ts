import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";

import { expect, inject, type TestFunction } from "vitest";

import type { FRONTENDS } from "@kosmojs/core";
import { pathExists, pathResolver } from "@kosmojs/lib";

import { contentPatternFor } from ".";
import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

type Frontend = keyof typeof FRONTENDS;

const pageExtensions: Record<Frontend, string> = {
  react: "tsx",
  solid: "tsx",
  vue: "vue",
  svelte: "svelte",
  mdx: "mdx",
};

// a page written by the user, told apart from a seeded one by its marker
const markerPages: Record<Frontend, (marker: string) => string> = {
  react: (marker) => `
    export default function Page() {
      return <div data-page-marker="${marker}">${marker}</div>;
    }
  `,
  solid: (marker) => `
    export default function Page() {
      return <div data-page-marker="${marker}">${marker}</div>;
    }
  `,
  vue: (marker) => `
    <template>
      <div data-page-marker="${marker}">${marker}</div>
    </template>
  `,
  svelte: (marker) => `<div data-page-marker="${marker}">${marker}</div>`,
  mdx: (marker) => `<div data-page-marker="${marker}">${marker}</div>`,
};

const markerPattern = (marker: string) => {
  return new RegExp(`data-page-marker="${marker}"`);
};

/**
 * The routes this suite starts from, written before the project builds:
 * - seeded: a blank index.ts alone; generators seed it and its page file;
 * - kept: a page file of the user's next to a blank index.ts;
 * - orphan: a page file of the user's with no index.ts, so not a route.
 * The dev server then sees routes added and removed while it runs.
 * */
const SEEDED = "page-routes/seeded";
const KEPT = "page-routes/kept";
const ORPHAN = "page-routes/orphan";
const LATE = "page-routes/late";

// tsc errors reported against the index.ts files under `dir`, as tsc prints their paths
const indexTypeErrors = (tsconfig: string, dir: string) => {
  const require = createRequire(import.meta.url);
  const pkgFile = require.resolve("typescript/package.json");
  const pkg = require(pkgFile);
  const tsc = resolve(dirname(pkgFile), pkg.bin.tsc || pkg.bin);
  const prefix = relative(dirname(tsconfig), dir);

  return new Promise<Array<string>>((resolvePromise) => {
    execFile(
      process.execPath,
      [tsc, "--project", tsconfig, "--noEmit", "--pretty", "false"],
      { cwd: dirname(tsconfig) },
      (_error, stdout) => {
        resolvePromise(
          stdout.split("\n").filter((line) => {
            return line.startsWith(prefix) && line.includes("/index.ts(");
          }),
        );
      },
    );
  });
};

export const createTestGroups = (frontend: Frontend): Array<TestGroup> => {
  const mode = inject("MODE");

  const createHarness = async () => {
    const {
      project,
      sourceFolder,
      bootstrapProject,
      withPageContent,
      withBrowserPage,
    } = await setupTestProject({ frontend });

    const { createPath } = pathResolver(project, sourceFolder);

    const ext = pageExtensions[frontend];

    const routeFile = (name: string) => createPath.pages(name, "index.ts");
    const pageFile = (name: string) => createPath.pages(name, `page.${ext}`);

    const read = (file: string) => readFile(file, "utf8").catch(() => "");

    // the page as served, or nothing when the route is not served
    const contentOf = async (name: string) => {
      try {
        const { content } = await withPageContent(name);
        return content;
      } catch {
        return "";
      }
    };

    const writeMarkerPage = async (name: string) => {
      await mkdir(createPath.pages(name), { recursive: true });
      await writeFile(pageFile(name), markerPages[frontend](name), "utf8");
    };

    const teardown = await bootstrapProject(async () => {
      await mkdir(createPath.pages(SEEDED), { recursive: true });
      await writeFile(routeFile(SEEDED), "", "utf8");

      await writeMarkerPage(KEPT);
      await writeFile(routeFile(KEPT), "", "utf8");

      await writeMarkerPage(ORPHAN);
    });

    const tests: Array<TestEntry> = [
      [
        "a blank index.ts is seeded with the route definition",
        async () => {
          expect(await read(routeFile(SEEDED))).toContain(
            `defineRoute<"${SEEDED}">()`,
          );
        },
      ],

      [
        "the page file of a blank route is seeded and rendered",
        async () => {
          expect((await read(pageFile(SEEDED))).trim()).not.toBe("");
          expect(await contentOf(SEEDED)).toMatch(contentPatternFor(SEEDED));
        },
      ],

      [
        "a page file already there is kept and rendered",
        async () => {
          expect(await read(pageFile(KEPT))).toBe(markerPages[frontend](KEPT));
          expect(await read(routeFile(KEPT))).toContain(
            `defineRoute<"${KEPT}">()`,
          );
          expect(await contentOf(KEPT)).toMatch(markerPattern(KEPT));
        },
      ],

      [
        "a page file without index.ts is not a route",
        async () => {
          expect(await pathExists(routeFile(ORPHAN))).toBe(false);
          expect(await read(pageFile(ORPHAN))).toBe(
            markerPages[frontend](ORPHAN),
          );
          expect(await contentOf(ORPHAN)).not.toMatch(markerPattern(ORPHAN));
        },
      ],
    ];

    if (mode !== "csr") {
      tests.push([
        "a page seeded by the build hydrates, the client bundle has it too",
        async () => {
          await withBrowserPage(async ({ page, url }) => {
            await page.goto(url(SEEDED));
            await page.waitForLoadState("networkidle");
            expect(await page.content()).toMatch(contentPatternFor(SEEDED));
          });
        },
      ]);
    }

    // the dev server watches pages, a build does not
    if (mode === "csr") {
      tests.push(
        [
          "seeded index.ts files typecheck",
          async () => {
            expect(
              await indexTypeErrors(
                createPath.src("tsconfig.json"),
                createPath.pages(),
              ),
            ).toEqual([]);
          },
        ],

        [
          "a blank index.ts added while serving becomes a route",
          async () => {
            await mkdir(createPath.pages(LATE), { recursive: true });
            await writeFile(routeFile(LATE), "", "utf8");

            await expect
              .poll(() => contentOf(LATE), { timeout: 5_000, interval: 500 })
              .toMatch(contentPatternFor(LATE));

            expect(await read(routeFile(LATE))).toContain(
              `defineRoute<"${LATE}">()`,
            );
          },
        ],

        [
          "an index.ts added next to a page file makes it a route",
          async () => {
            await writeFile(routeFile(ORPHAN), "", "utf8");

            await expect
              .poll(() => contentOf(ORPHAN), {
                timeout: 5_000,
                interval: 500,
              })
              .toMatch(markerPattern(ORPHAN));

            expect(await read(pageFile(ORPHAN))).toBe(
              markerPages[frontend](ORPHAN),
            );
          },
        ],

        [
          "deleting index.ts drops the route and leaves its page file alone",
          async () => {
            await rm(routeFile(KEPT));

            await expect
              .poll(() => contentOf(KEPT), { timeout: 5_000, interval: 500 })
              .not.toMatch(markerPattern(KEPT));

            expect(await read(pageFile(KEPT))).toBe(
              markerPages[frontend](KEPT),
            );
          },
        ],
      );
    }

    return { tests, teardown };
  };

  return [{ name: `${frontend}: page routes`, createHarness }];
};
