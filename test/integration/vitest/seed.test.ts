import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, posix } from "node:path";

import { describe, expect, test } from "vitest";

import { DEFAULT_TEST_FILE, type VitestOptions } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import { routes } from ".";

type FileMap = Record<string, string>;

type FileBucket = {
  root: FileMap;
  api: FileMap;
  apiCustomPath: FileMap;
  pages: FileMap;
  pagesCustomPath: FileMap;
};

const exactMatchRoute: (typeof routes)[number] = "about";
const subtreeMatchRoute: (typeof routes)[number] = "landing";
const theOnlyEnabledRoute: (typeof routes)[number] = "blog";

const functionTemplate = () => "";
functionTemplate.toJSON = () => "FUNCTION_TEMPLATE_PLACEHOLDER";

const variants: Array<
  [
    name: string,
    opts: boolean | VitestOptions,
    test: Array<keyof ReturnType<typeof runnersFactory>>,
  ]
> = [
  [
    "false test key seeds nothing",
    false,
    ["noRootConfigSeeded", "noApiFilesSeeded", "noPageFilesSeeded"],
  ],

  [
    "true test key is enabling testing with default options",
    true,
    [
      "rootConfigSeeded",
      "apiRoutesSeededWithDefaultOptions",
      "pageRoutesSeededWithDefaultOptions",
    ],
  ],

  [
    "empty object is enabling testing with default options", // though is a typing error
    {} as never,
    [
      "rootConfigSeeded",
      "apiRoutesSeededWithDefaultOptions",
      "pageRoutesSeededWithDefaultOptions",
    ],
  ],

  [
    "false seed key seeds only root config file",
    { seed: false },
    ["rootConfigSeeded", "noApiFilesSeeded", "noPageFilesSeeded"],
  ],

  [
    "true seed key is seeding with default options",
    { seed: true },
    [
      "rootConfigSeeded",
      "apiRoutesSeededWithDefaultOptions",
      "pageRoutesSeededWithDefaultOptions",
    ],
  ],

  [
    "seed.name is seeding a custom test file",
    { seed: { name: "route.spec.ts" } },
    ["apiRoutesSeededWithCustomName", "pageRoutesSeededWithCustomName"],
  ],
  [
    "seed.path is seeding at a custom path",
    { seed: { path: "spec" } },
    ["apiRoutesSeededWithCustomPath", "pageRoutesSeededWithCustomPath"],
  ],

  [
    "seed.path with seed.name is seeding a custom path/name",
    { seed: { path: "spec", name: "route.spec.ts" } },
    [
      "apiRoutesSeededWithCustomPathAndName",
      "pageRoutesSeededWithCustomPathAndName",
    ],
  ],

  [
    "seed patterns: disable seeding globally",
    { seed: { "**": false } },
    ["rootConfigSeeded", "noApiFilesSeeded", "noPageFilesSeeded"],
  ],

  [
    "seed patterns: disable seeding for a specific route only",
    { seed: { [exactMatchRoute]: false } },
    ["apiSeedDisabledByExactMatch", "pageSeedDisabledByExactMatch"],
  ],

  [
    "seed patterns: disable seeding for a route subtree",
    { seed: { [`${subtreeMatchRoute}/**`]: false } },
    ["apiSubtreeSeedDisabled", "pageSubtreeSeedDisabled"],
  ],

  [
    "seed patterns: disable seeding for all routes except select one",
    { seed: { [theOnlyEnabledRoute]: true, "**": false } },
    ["apiSeedEnabledByExactMatch", "pageSeedEnabledByExactMatch"],
  ],

  [
    "seed patterns: disable seeding for all routes except select subtree",
    { seed: { [`${theOnlyEnabledRoute}/**`]: true, "**": false } },
    ["apiSeedEnabledBySubtreePattern", "pageSeedEnabledBySubtreePattern"],
  ],

  [
    "seed templates: string template",
    { seed: { "**": "string template" } },
    ["apiRoutesSeededWithCustomTemplate", "pageRoutesSeededWithCustomTemplate"],
  ],

  [
    "seed templates: function template",
    {
      seed: { "**": functionTemplate },
    },
    [
      "apiRoutesSeededWithFunctionTemplate",
      "pageRoutesSeededWithFunctionTemplate",
    ],
  ],
] as const;

const runnersFactory = (
  { root, api, apiCustomPath, pages, pagesCustomPath }: FileBucket,
  options?: VitestOptions,
) => {
  const rootConfig = root["vitest.config.ts"];

  const testFile = DEFAULT_TEST_FILE;

  const customFile =
    typeof options?.seed === "object" //
      ? options.seed.name
      : undefined;

  const apiTemplatePatterns = [
    /import.+prepareHarness.+from.+_\/test\/api/,
    /const.+client,.+await\s+prepareHarness\(".+"\)/,
  ];

  const pageTemplatePatterns = [
    /import.+prepareHarness.+from.+_\/test\/pages/,
    /const.+page,.+await\s+prepareHarness\(".+"\)/,
  ];

  return {
    rootConfigSeeded() {
      expect(rootConfig).toMatch(/import.+loadConfig.+from.+@kosmojs\/vitest/);
      expect(rootConfig).toMatch("defineConfig");
      expect(rootConfig).toMatch("mergeConfig");
      expect(rootConfig).toMatch(/await.+loadConfig\(/);
    },
    noRootConfigSeeded() {
      expect(rootConfig).toBeUndefined();
    },
    noApiFilesSeeded() {
      expect(
        Object.keys(api).some((e) => basename(e) === testFile),
      ).toBeFalsy();
    },
    noPageFilesSeeded() {
      expect(
        Object.keys(pages).some((e) => basename(e) === testFile),
      ).toBeFalsy();
    },
    apiRoutesSeededWithDefaultOptions() {
      for (const route of routes) {
        for (const pattern of apiTemplatePatterns) {
          expect(api[`${route}/${testFile}`]).toMatch(pattern);
        }
      }
    },
    pageRoutesSeededWithDefaultOptions() {
      for (const route of routes) {
        for (const pattern of pageTemplatePatterns) {
          expect(pages[`${route}/${testFile}`]).toMatch(pattern);
        }
      }
    },
    apiRoutesSeededWithCustomName() {
      for (const route of routes) {
        for (const pattern of apiTemplatePatterns) {
          expect(api[`${route}/${customFile}`]).toMatch(pattern);
        }
      }
    },
    pageRoutesSeededWithCustomName() {
      for (const route of routes) {
        for (const pattern of pageTemplatePatterns) {
          expect(pages[`${route}/${customFile}`]).toMatch(pattern);
        }
      }
    },
    apiRoutesSeededWithCustomPath() {
      for (const route of routes) {
        for (const pattern of apiTemplatePatterns) {
          expect(apiCustomPath[`${route}/${testFile}`]).toMatch(pattern);
        }
      }
    },
    pageRoutesSeededWithCustomPath() {
      for (const route of routes) {
        for (const pattern of pageTemplatePatterns) {
          expect(pagesCustomPath[`${route}/${testFile}`]).toMatch(pattern);
        }
      }
    },
    apiRoutesSeededWithCustomPathAndName() {
      for (const route of routes) {
        for (const pattern of apiTemplatePatterns) {
          expect(apiCustomPath[`${route}/${customFile}`]).toMatch(pattern);
        }
      }
    },
    pageRoutesSeededWithCustomPathAndName() {
      for (const route of routes) {
        for (const pattern of pageTemplatePatterns) {
          expect(pagesCustomPath[`${route}/${customFile}`]).toMatch(pattern);
        }
      }
    },
    apiSeedDisabledByExactMatch() {
      for (const route of routes) {
        if (route === exactMatchRoute) {
          expect(api[`${route}/${testFile}`]).toBeUndefined();
        } else {
          for (const pattern of apiTemplatePatterns) {
            expect(api[`${route}/${testFile}`]).toMatch(pattern);
          }
        }
      }
    },
    pageSeedDisabledByExactMatch() {
      for (const route of routes) {
        if (route === exactMatchRoute) {
          expect(pages[`${route}/${testFile}`]).toBeUndefined();
        } else {
          for (const pattern of pageTemplatePatterns) {
            expect(pages[`${route}/${testFile}`]).toMatch(pattern);
          }
        }
      }
    },
    apiSubtreeSeedDisabled() {
      for (const route of routes) {
        if (
          route === subtreeMatchRoute ||
          route.startsWith(`${subtreeMatchRoute}/`)
        ) {
          expect(api[`${route}/${testFile}`]).toBeUndefined();
        } else {
          for (const pattern of apiTemplatePatterns) {
            expect(api[`${route}/${testFile}`]).toMatch(pattern);
          }
        }
      }
    },
    pageSubtreeSeedDisabled() {
      for (const route of routes) {
        if (
          route === subtreeMatchRoute ||
          route.startsWith(`${subtreeMatchRoute}/`)
        ) {
          expect(pages[`${route}/${testFile}`]).toBeUndefined();
        } else {
          for (const pattern of pageTemplatePatterns) {
            expect(pages[`${route}/${testFile}`]).toMatch(pattern);
          }
        }
      }
    },
    apiSeedEnabledByExactMatch() {
      for (const route of routes) {
        if (route === theOnlyEnabledRoute) {
          for (const pattern of apiTemplatePatterns) {
            expect(api[`${route}/${testFile}`]).toMatch(pattern);
          }
        } else {
          expect(api[`${route}/${testFile}`]).toBeUndefined();
        }
      }
    },
    pageSeedEnabledByExactMatch() {
      for (const route of routes) {
        if (route === theOnlyEnabledRoute) {
          for (const pattern of pageTemplatePatterns) {
            expect(pages[`${route}/${testFile}`]).toMatch(pattern);
          }
        } else {
          expect(pages[`${route}/${testFile}`]).toBeUndefined();
        }
      }
    },
    apiSeedEnabledBySubtreePattern() {
      for (const route of routes) {
        if (
          route === theOnlyEnabledRoute ||
          route.startsWith(`${theOnlyEnabledRoute}/`)
        ) {
          for (const pattern of apiTemplatePatterns) {
            expect(api[`${route}/${testFile}`]).toMatch(pattern);
          }
        } else {
          expect(api[`${route}/${testFile}`]).toBeUndefined();
        }
      }
    },
    pageSeedEnabledBySubtreePattern() {
      for (const route of routes) {
        if (
          route === theOnlyEnabledRoute ||
          route.startsWith(`${theOnlyEnabledRoute}/`)
        ) {
          for (const pattern of pageTemplatePatterns) {
            expect(pages[`${route}/${testFile}`]).toMatch(pattern);
          }
        } else {
          expect(pages[`${route}/${testFile}`]).toBeUndefined();
        }
      }
    },
    apiRoutesSeededWithCustomTemplate() {
      for (const route of routes) {
        expect(api[`${route}/${testFile}`]).toEqual("string template");
      }
    },
    pageRoutesSeededWithCustomTemplate() {
      for (const route of routes) {
        expect(api[`${route}/${testFile}`]).toEqual("string template");
      }
    },
    apiRoutesSeededWithFunctionTemplate() {
      for (const route of routes) {
        expect(api[`${route}/${testFile}`]).toEqual("function template");
      }
    },
    pageRoutesSeededWithFunctionTemplate() {
      for (const route of routes) {
        expect(api[`${route}/${testFile}`]).toEqual("function template");
      }
    },
  };
};

for (const [name, options, runners] of variants) {
  describe(name, async ({ afterAll }) => {
    const {
      project,
      sourceFolder,
      bootstrapProject,
      createApiRoutes,
      createPageRoutes,
    } = await setupTestProject(
      {
        backend: "random",
        frontend: "random",
      },
      {
        frontend: { test: options },
        backend: { test: options },
      },
    );

    const { createPath } = pathResolver(project, sourceFolder);

    const teardown = await bootstrapProject(async () => {
      const configFile = createPath.src("kosmo.config.ts");
      const config = await readFile(configFile, "utf8");
      await writeFile(
        configFile,
        config.replace(
          /"FUNCTION_TEMPLATE_PLACEHOLDER"/g,
          `() => "function template"`,
        ),
        "utf8",
      );
      await createApiRoutes(routes.map((name) => ({ name })));
      await createPageRoutes(routes.map((name) => ({ name })));
    });

    afterAll(teardown);

    const customPath =
      typeof options === "object" && typeof options?.seed === "object"
        ? options.seed.path
        : undefined;

    const entries = await readdir(project.root, {
      recursive: true,
      withFileTypes: true,
    });

    const bucket: FileBucket = {
      root: {},
      api: {},
      apiCustomPath: {},
      pages: {},
      pagesCustomPath: {},
    };

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      let pair: [keyof FileBucket, string] | undefined;

      if (entry.parentPath.startsWith(createPath.api())) {
        pair = ["api", createPath.api()];
      } else if (entry.parentPath.startsWith(createPath.pages())) {
        pair = ["pages", createPath.pages()];
      } else if (
        customPath &&
        entry.parentPath.startsWith(createPath.src(customPath, "api"))
      ) {
        pair = ["apiCustomPath", createPath.src(customPath, "api")];
      } else if (
        customPath &&
        entry.parentPath.startsWith(createPath.src(customPath, "pages"))
      ) {
        pair = ["pagesCustomPath", createPath.src(customPath, "pages")];
      } else if (entry.parentPath === project.root) {
        pair = ["root", project.root];
      }

      if (pair) {
        const [key, root] = pair;
        bucket[key][
          posix
            .join(entry.parentPath.replace(root, ""), entry.name)
            .replace("/", "")
        ] = await readFile(join(entry.parentPath, entry.name), "utf8");
      }
    }

    const runnersMap = runnersFactory(
      bucket,
      ...(typeof options === "object" ? [options] : []),
    );

    for (const name of runners) {
      test(name, runnersMap[name]);
    }
  });
}
