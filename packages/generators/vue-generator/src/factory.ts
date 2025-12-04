import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import picomatch, { type Matcher } from "picomatch";

import { nestedRoutesFactory } from "@kosmojs/dev/routes";
import {
  defaults,
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  type RouteEntry,
  renderFactory,
  renderToFile,
  sortRoutes,
} from "@kosmojs/devlib";

import { randomCongratMessage, traverseFactory } from "./base";
import type { Options } from "./types";

import libFetchUnwrapTpl from "./templates/lib/fetch/unwrap.hbs";
import libPagesTpl from "./templates/lib/pages.hbs";
import libVueClientTpl from "./templates/lib/vue/client.hbs";
import libVueIndexTpl from "./templates/lib/vue/index.hbs";
import libVueRoutePartialTpl from "./templates/lib/vue/routePartial.hbs";
import libVueServerTpl from "./templates/lib/vue/server.hbs";
import stylesTpl from "./templates/lib/vue/styles.css?as=text";
import libVueUseTpl from "./templates/lib/vue/use.hbs";
import paramTpl from "./templates/param.hbs";
import publicAppTpl from "./templates/public/App.hbs";
import publicComponentsLinkTpl from "./templates/public/components/Link.hbs";
import publicEntryClientTpl from "./templates/public/entry/client.hbs";
import publicEntryServerTpl from "./templates/public/entry/server.hbs";
import publicEnvTpl from "./templates/public/env.hbs";
import publicIndexTpl from "./templates/public/index.html?as=text";
import publicLayoutTpl from "./templates/public/layout.hbs";
import publicPageTpl from "./templates/public/page.hbs";
import publicRouterTpl from "./templates/public/router.hbs";
import welcomePageTpl from "./templates/public/welcome-page.hbs";

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, formatters, generators, command },
  options,
) => {
  const { resolve } = pathResolver({ appRoot, sourceFolder });

  const customTemplates: Array<[Matcher, string]> = Object.entries({
    ...options.templates,
  }).map(([pattern, template]) => [picomatch(pattern), template]);

  const ssrGenerator = generators.some((e) => e.kind === "ssr");

  const entriesTraverser = traverseFactory(options);

  await mkdir(resolve("libDir", sourceFolder, "{vue}"), { recursive: true });

  await writeFile(
    resolve("libDir", sourceFolder, "{vue}/styles.module.css"),
    stylesTpl,
    "utf8",
  );

  await renderToFile(
    resolve("fetchLibDir", "unwrap.ts"),
    libFetchUnwrapTpl,
    {},
    { formatters },
  );

  for (const [file, template] of [
    ["env.d.ts", publicEnvTpl],
    ["components/Link.vue", publicComponentsLinkTpl],
    ["App.vue", publicAppTpl],
    ["router.ts", publicRouterTpl],
    [join(defaults.entryDir, "client.ts"), publicEntryClientTpl],
    ["index.html", publicIndexTpl],
    ...(ssrGenerator
      ? [[join(defaults.entryDir, "server.ts"), publicEntryServerTpl]]
      : []),
  ] as const) {
    await renderToFile(
      resolve("@", file),
      template,
      {
        defaults,
        sourceFolder,
        importPathmap: {
          config: join(sourceFolder, defaults.configDir),
          pageMap: join(sourceFolder, defaults.pagesLibDir),
          fetch: join(sourceFolder, defaults.fetchLibDir),
          vue: join(sourceFolder, "{vue}"),
        },
      },
      {
        // For index.html: overwrite only if empty or missing "<!--app-html-->".
        // For other files: overwrite only if blank.
        overwrite:
          file === "index.html"
            ? (c) => !c?.trim().length || !c?.includes("<!--app-html-->")
            : (c) => !c?.trim().length,
        formatters,
      },
    );
  }

  const generatePublicFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind === "pageRoute") {
        const customTemplate = customTemplates.find(([isMatch]) => {
          return isMatch(entry.name);
        });

        await renderToFile(
          resolve("pagesDir", entry.file),
          entry.name === "index"
            ? welcomePageTpl
            : customTemplate?.[1] || publicPageTpl,
          {
            defaults,
            route: entry,
            message: randomCongratMessage(),
            importPathmap: {
              styles: join(sourceFolder, "{vue}/styles.module.css"),
            },
          },
          {
            // write only to blank files
            overwrite: (fileContent) => !fileContent?.trim().length,
            formatters,
          },
        );
      } else if (kind === "pageLayout") {
        await renderToFile(
          resolve("pagesDir", entry.file),
          publicLayoutTpl,
          { route: entry },
          {
            // write only to blank files
            overwrite: (fileContent) => !fileContent?.trim().length,
            formatters,
          },
        );
      }
    }
  };

  const generateIndexFiles = async (entries: Array<ResolvedEntry>) => {
    const { render, renderToFile } = renderFactory({
      formatters,
      partials: {
        routePartial: libVueRoutePartialTpl,
      },
      helpers: {
        importPath({ importFile }: RouteEntry) {
          return join(sourceFolder, defaults.pagesDir, importFile);
        },
      },
    });

    const indexRoutes = entries
      .flatMap(({ kind, entry }) => {
        return kind === "pageRoute"
          ? [
              {
                ...entry,
                paramsLiteral: entry.params.schema
                  .map((param) => render(paramTpl, { param }).trim())
                  .join(", "),
              },
            ]
          : [];
      })
      .sort(sortRoutes);

    const pageEntries = entries.flatMap(({ kind, entry }) => {
      return kind === "pageRoute" || kind === "pageLayout" ? [entry] : [];
    });

    const nestedRoutes = entriesTraverser(nestedRoutesFactory(pageEntries));

    const shouldHydrate = JSON.stringify(
      ssrGenerator ? command === "build" : false,
    );

    const importPathmap = {
      config: join(sourceFolder, defaults.configDir),
      fetch: join(sourceFolder, defaults.fetchLibDir),
    };

    for (const [file, template] of [
      ["{vue}/index.ts", libVueIndexTpl],
      ["{vue}/client.ts", libVueClientTpl],
      ["{vue}/server.ts", libVueServerTpl],
      ["{vue}/use.ts", libVueUseTpl],
      [`${defaults.pagesLibDir}.ts`, libPagesTpl],
    ]) {
      await renderToFile(resolve("libDir", sourceFolder, file), template, {
        pageEntries,
        indexRoutes,
        nestedRoutes,
        shouldHydrate,
        importPathmap,
      });
    }
  };

  return {
    async watchHandler(entries, event) {
      // Fill empty route files with templates (default or custom)
      // - Initial call (event is undefined): process all routes
      // - Create event: process newly added route
      if (!event || event.kind === "create") {
        await generatePublicFiles(entries);
      }

      // Always regenerate index files to keep router in sync
      await generateIndexFiles(entries);
    },
  };
};
