import { posix } from "node:path";

import { load } from "cheerio";
import { inject, type TestFunction } from "vitest";

import { type FRONTENDS, stringifySearchParams } from "@kosmojs/core";

import { routes } from "./@fixtures/link/routes";
import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

export type LinkTemplateData = {
  links: Array<{
    // data-testid of the rendered anchor
    id: string;
    // JSON-serialized [name, ...params] tuple - a valid JS expression;
    // route names never contain quotes, so it is also safe inside a single-quoted attribute (vue)
    to: string;
    // JSON-serialized query object, undefined when the link has no query
    query: string | undefined;
    label: string;
  }>;
};

// the test page is written straight to disk,
// bypassing the handlebars pass that frontend.templates would go through,
// so route names like "docs/{...path}" and JSX props like query={...} need no escaping
export const NAVIGATION_PAGE = "navigation";

export const createTestGroups = ({
  frontend,
  template,
  bases = ["/", `/${frontend}`],
}: {
  frontend: keyof typeof FRONTENDS;
  template: (data: LinkTemplateData) => string;
  // every base gets its own project;
  // "/" and a non-root base cover both branches of path()'s base handling
  bases?: Array<string>;
}) => {
  const mode = inject("MODE");

  const testGroups: Array<TestGroup> = [];

  const links: LinkTemplateData["links"] = routes.map(
    ({ id, name, params, query, label }) => ({
      id,
      to: JSON.stringify([name, ...Object.values(params)]),
      query: query ? JSON.stringify(query) : undefined,
      label,
    }),
  );

  for (const base of bases) {
    const createHarness = async () => {
      const {
        //
        bootstrapProject,
        createPageRoutes,
        withPageContent,
      } = await setupTestProject({ frontend, base });

      const teardown = await bootstrapProject(async () => {
        await createPageRoutes(
          routes.map(({ name }) => ({ name })),
          async ({ name }) => {
            return () => {
              // empty files are seeded with the default page template
              return name === NAVIGATION_PAGE ? template({ links }) : "";
            };
          },
        );
      });

      // one page load per group, shared by every link test
      let pageContent: Promise<string> | undefined;

      const loadPage = () => {
        pageContent ??= withPageContent([NAVIGATION_PAGE]).then(
          ({ content }) => content,
        );
        return pageContent;
      };

      const tests: Array<TestEntry> = [];

      tests.push([
        "renders the navigation page with one anchor per link",
        async ({ expect }) => {
          const $ = load(await loadPage());
          expect($('[data-testid="navigation-page"]').length).toBe(1);
          expect($("a").length).toBe(routes.length);
        },
      ]);

      for (const route of routes) {
        const { id, name, params, query, href, label } = route;

        const expectedHref = [
          normalizePath(posix.join(base, href)),
          ...(query ? [stringifySearchParams(query)] : []),
        ].join("?");

        tests.push([
          [id, name, JSON.stringify(Object.values(params))].join(" | "),
          async ({ expect }) => {
            const $ = load(await loadPage());

            const element = $(`a[data-testid="${id}"]`);
            expect(element.length, `anchor ${id} missing`).toBe(1);

            const actualHref = element.attr("href") ?? "";

            expect(actualHref, `empty href for ${name}`).not.toBe("");

            expect(actualHref, `double slash in href for ${name}`).not.toMatch(
              /\/\//,
            );

            const [actualPath, ...actualSearch] = actualHref.split("?");

            expect(
              [normalizePath(actualPath), ...actualSearch].join("?"),
              `href for ${name} with base ${base}`,
            ).toBe(expectedHref);

            expect(element.text().trim()).toBe(label);
          },
        ]);
      }

      return { tests, teardown };
    };

    testGroups.push({
      name: [frontend, mode, `base=${base}`].filter(Boolean).join(":"),
      createHarness,
    });
  }

  return testGroups;
};

// routers differ on whether the folder root renders as "/base" or "/base/";
// that is not what these tests cover, so compare without the trailing slash
const normalizePath = (path: string) => {
  return path.replace(/(?<=[^/])\/$/, "");
};
