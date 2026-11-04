import { readFile, writeFile } from "node:fs/promises";

import { load } from "cheerio";
import { inject, type TestFunction } from "vitest";

import type { BACKENDS, FRONTENDS } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { contentPatternFor } from ".";
import {
  markerFor,
  TEMPLATES_MODULE,
  TEMPLATES_SENTINEL,
} from "./@fixtures/templates";
import * as api from "./@fixtures/templates/api";
import * as pages from "./@fixtures/templates/pages";
import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

// stands in for the test id inside a template source, filled in at seed time
const ID = "%%ID%%";

// stands in for the route name inside a backend template source
const NAME = "%%NAME%%";

const pageExtensions: Record<keyof typeof FRONTENDS, string> = {
  react: "tsx",
  solid: "tsx",
  vue: "vue",
  svelte: "svelte",
  mdx: "mdx",
};

type Project = Awaited<ReturnType<typeof setupTestProject>>;

/**
 * Writes the templates module and points kosmo.config.ts at it.
 * The folder config reaches kosmo.config.ts as JSON, which drops functions,
 * so the templates option carries a sentinel string until this swaps it for an import.
 * Runs before the build, the first point anything loads the config.
 * */
const installTemplates = async (
  { project, sourceFolder }: Project,
  moduleSource: string,
) => {
  const { createPath } = pathResolver(project, sourceFolder);

  const configFile = createPath.src("kosmo.config.ts");
  const config = await readFile(configFile, "utf8");
  const sentinel = JSON.stringify(TEMPLATES_SENTINEL);

  if (!config.includes(sentinel)) {
    throw new Error(`${configFile} has no templates sentinel`);
  }

  await writeFile(
    configFile,
    [
      `import templates from "./${TEMPLATES_MODULE}";`,
      config.replace(sentinel, "templates"),
    ].join("\n"),
  );

  await writeFile(createPath.src(`${TEMPLATES_MODULE}.ts`), moduleSource);
};

const collect = (source: string, pattern: RegExp) => {
  return [...source.matchAll(pattern)].map(([, value]) => value);
};

export const createFrontendTestGroups = ({
  frontend,
  page,
  layout,
}: {
  frontend: keyof typeof FRONTENDS;
  // page source rendering an element with data-testid set to the given id
  page: (id: string) => string;
  // layout source wrapping its children in an element with data-testid set to the given id
  layout: (id: string) => string;
}) => {
  const mode = inject("MODE");

  // the ids every custom template in this suite uses; a built-in file has none of them
  const customIds =
    /data-testid="((?:string|pageRoute|pageLayout|user)-[\w-]+)"/g;

  const moduleSource = `
    type TemplateArg = { kind: string; entry: { name: string } };
    const markerFor = ${markerFor.toString()};
    const fill = (source: string, id: string) => source.replaceAll(${JSON.stringify(ID)}, id);

    const pageSource = ${JSON.stringify(page(ID))};
    const layoutSource = ${JSON.stringify(layout(ID))};
    const skipped: Array<string> = ${JSON.stringify(pages.functionSkipped)};

    export default {
      ${Object.entries(pages.stringTemplates)
        .map(([pattern, id]) => {
          return `${JSON.stringify(pattern)}: fill(pageSource, ${JSON.stringify(id)}),`;
        })
        .join("\n")}
      ${JSON.stringify(pages.functionPattern)}: ({ kind, entry }: TemplateArg) => {
        if (skipped.includes(entry.name)) {
          return undefined;
        }
        if (kind === "pageLayout") {
          return fill(layoutSource, markerFor(kind, entry.name));
        }
        if (kind === "pageRoute") {
          return fill(pageSource, markerFor(kind, entry.name));
        }
        return undefined;
      },
    };
  `;

  const createHarness = async () => {
    const project = await setupTestProject(
      { frontend },
      { frontend: { templates: TEMPLATES_SENTINEL as never } },
    );

    const { createPath } = pathResolver(project.project, project.sourceFolder);

    const teardown = await project.bootstrapProject(async () => {
      await installTemplates(project, moduleSource);
      await project.createPageRoutes(
        pages.pageCases,
        async ({ name, file }) => {
          const { content } =
            pages.pageCases.find((e) => e.name === name && e.file === file) ||
            {};
          // empty files are seeded by the generator, written ones are kept
          return () => (content ? page(content.id) : "");
        },
      );
    });

    const tests: Array<TestEntry> = [];

    for (const { name, file, expected } of pages.pageCases) {
      tests.push([
        `seeds ${name}/${file}: ${expected ?? "built-in"}`,
        async ({ expect }) => {
          const source = await readFile(
            createPath.pages(name, `${file}.${pageExtensions[frontend]}`),
            "utf8",
          );
          expect(collect(source, customIds), source).toEqual(
            expected ? [expected] : [],
          );
        },
      ]);
    }

    for (const {
      route,
      params,
      page: pageId,
      layouts = [],
    } of pages.renderCases) {
      tests.push([
        `renders ${[route, JSON.stringify(Object.values({ ...params }))].join(" | ")}`,
        async ({ expect }) => {
          const { content } = await project.withPageContent([route, params]);
          const $ = load(content);

          if (pageId) {
            expect($(`[data-testid="${pageId}"]`).length, content).toBe(1);
          } else {
            expect(content).toMatch(contentPatternFor(route));
            expect(
              $('[data-testid^="string-"], [data-testid^="pageRoute-"]').length,
              content,
            ).toBe(0);
          }

          // each layout, outermost first, wraps the next one and finally the page
          const pageSelector = pageId
            ? `[data-testid="${pageId}"]`
            : "[data-page-route]";

          const chain = [
            ...layouts.map((id) => `[data-testid="${id}"]`),
            pageSelector,
          ];

          expect($(chain.join(" ")).length, content).toBeGreaterThan(0);
        },
      ]);
    }

    return { tests, teardown };
  };

  return [
    {
      name: [frontend, mode].filter(Boolean).join(":"),
      createHarness,
    },
  ] satisfies Array<TestGroup>;
};

type BackendSources = {
  // middleware pushing the given marker onto the request's stack
  use: (marker: string) => string;
  // GET handler responding with the stack collected so far plus the given marker
  route: (name: string, marker: string) => string;
};

const backendSources: Record<keyof typeof BACKENDS, BackendSources> = {
  hono: {
    use: (marker) => `
      import { use } from "_/api";
      export type UseT = { stack: Array<string> };
      export default [
        use<UseT>((ctx, next) => {
          if (!ctx.var.stack) {
            ctx.set("stack", []);
          }
          ctx.var.stack.push(${JSON.stringify(marker)});
          return next();
        }),
      ];
    `,
    route: (name, marker) => `
      import { defineRoute } from "_/api";
      export default defineRoute<"${name}">(({ GET }) => [
        GET(async (ctx) => {
          const { stack = [] } = ctx.var as { stack?: Array<string> };
          return ctx.json([...stack, ${JSON.stringify(marker)}]);
        }),
      ]);
    `,
  },
  h3: {
    use: (marker) => `
      import { use } from "_/api";
      export type UseT = { stack: Array<string> };
      export default [
        use<UseT>((event, next) => {
          if (!event.context.stack) {
            event.context.stack = [];
          }
          event.context.stack.push(${JSON.stringify(marker)});
          return next();
        }),
      ];
    `,
    route: (name, marker) => `
      import { defineRoute } from "_/api";
      export default defineRoute<"${name}">(({ GET }) => [
        GET(async (event) => {
          const { stack = [] } = event.context as { stack?: Array<string> };
          return [...stack, ${JSON.stringify(marker)}];
        }),
      ]);
    `,
  },
  koa: {
    use: (marker) => `
      import { use } from "_/api";
      export type UseT = { stack: Array<string> };
      export default [
        use<UseT>((ctx, next) => {
          if (!ctx.state.stack) {
            ctx.state.stack = [];
          }
          ctx.state.stack.push(${JSON.stringify(marker)});
          return next();
        }),
      ];
    `,
    route: (name, marker) => `
      import { defineRoute } from "_/api";
      export default defineRoute<"${name}">(({ GET }) => [
        GET(async (ctx) => {
          const { stack = [] } = ctx.state as { stack?: Array<string> };
          ctx.body = [...stack, ${JSON.stringify(marker)}];
        }),
      ]);
    `,
  },
};

export const createBackendTestGroups = (backend: keyof typeof BACKENDS) => {
  const mode = inject("MODE");

  const sources = backendSources[backend];

  // the markers every custom template in this suite uses; a built-in file has none of them
  const customMarkers =
    /"((?:string-route|user-kept|apiUse-[\w-]+|apiRoute-[\w-]+))"/g;

  const moduleSource = `
    type TemplateArg = { kind: string; entry: { name: string } };
    const markerFor = ${markerFor.toString()};
    const fill = (source: string, name: string, id: string) => {
      return source.replaceAll(${JSON.stringify(NAME)}, name).replaceAll(${JSON.stringify(ID)}, id);
    };

    const useSource = ${JSON.stringify(sources.use(ID))};
    const routeSource = ${JSON.stringify(sources.route(NAME, ID))};
    const skipped: Array<string> = ${JSON.stringify(api.functionSkipped)};

    export default {
      // a string template, rendered with the route as handlebars context
      ${JSON.stringify(api.stringPattern)}: ${JSON.stringify(
        sources.route("{{route.name}}", api.STRING_ROUTE_MARKER),
      )},
      ${JSON.stringify(api.functionPattern)}: ({ kind, entry }: TemplateArg) => {
        if (skipped.includes(entry.name)) {
          return undefined;
        }
        if (kind === "apiUse") {
          return fill(useSource, entry.name, markerFor(kind, entry.name));
        }
        if (kind === "apiRoute") {
          return fill(routeSource, entry.name, markerFor(kind, entry.name));
        }
        return undefined;
      },
    };
  `;

  const createHarness = async () => {
    const project = await setupTestProject(
      { backend },
      { backend: { templates: TEMPLATES_SENTINEL as never } },
    );

    const { createPath } = pathResolver(project.project, project.sourceFolder);

    const teardown = await project.bootstrapProject(async () => {
      await installTemplates(project, moduleSource);
      await project.createApiRoutes(api.apiCases, async ({ name, file }) => {
        const { content } =
          api.apiCases.find((e) => e.name === name && e.file === file) || {};
        // empty files are seeded by the generator, written ones are kept
        return () => (content ? sources.route(name, content.marker) : "");
      });
    });

    const tests: Array<TestEntry> = [];

    for (const { name, file, expected } of api.apiCases) {
      tests.push([
        `seeds ${name}/${file}: ${expected ?? "built-in"}`,
        async ({ expect }) => {
          const source = await readFile(
            createPath.api(name, `${file}.ts`),
            "utf8",
          );
          expect(collect(source, customMarkers), source).toEqual(
            expected ? [expected] : [],
          );
        },
      ]);
    }

    for (const { route, params, body } of api.responseCases) {
      tests.push([
        `responds ${[route, JSON.stringify(Object.values({ ...params }))].join(" | ")}`,
        async ({ expect }) => {
          const { response } = await project.withApiResponse([route, params]);
          expect(response.statusCode).toBe(200);
          if (body) {
            expect(JSON.parse(response.body as string)).toEqual(body);
          } else {
            // the built-in route answers with a plain text placeholder
            expect(response.body).toContain(`${route} route starts here`);
          }
        },
      ]);
    }

    return { tests, teardown };
  };

  return [
    {
      name: [backend, mode].filter(Boolean).join(":"),
      createHarness,
    },
  ] satisfies Array<TestGroup>;
};
