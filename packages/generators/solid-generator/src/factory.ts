import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { styleText } from "node:util";

import picomatch, { type Matcher } from "picomatch";

import { nestedRoutesFactory } from "@kosmojs/dev/routes";
import {
  defaults,
  type GeneratorFactory,
  pathExists,
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
import libSolidClientTpl from "./templates/lib/solid/client.hbs";
import libSolidIndexTpl from "./templates/lib/solid/index.hbs";
import libSolidRoutePartialTpl from "./templates/lib/solid/routePartial.hbs";
import libSolidServerTpl from "./templates/lib/solid/server.hbs";
import stylesTpl from "./templates/lib/solid/styles.css?as=text";
import libSolidUseTpl from "./templates/lib/solid/use.hbs";
import paramTpl from "./templates/param.hbs";
import publicAppTpl from "./templates/public/App.hbs";
import publicComponentsLinkTpl from "./templates/public/components/Link.hbs";
import publicEntryClientTpl from "./templates/public/entry/client.hbs";
import publicEntryServerTpl from "./templates/public/entry/server.hbs";
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

  const tsconfigFile = join(appRoot, "tsconfig.json");
  const tsconfigExists = await pathExists(tsconfigFile);

  if (!tsconfigExists) {
    throw new Error("SolidGenerator: missing tsconfig.json file");
  }

  const compilerOptions = await import(tsconfigFile, {
    with: { type: "json" },
  }).then((e) => e.default.compilerOptions);

  if (compilerOptions?.jsx !== "preserve") {
    console.error();
    console.error(
      styleText("red", "✗ SolidGenerator: tsconfig issue detected"),
    );
    console.error(
      [
        `  It is highly recommended to add the following lines\n`,
        `  to your ${styleText("blue", basename(tsconfigFile))}, `,
        `  inside the ${styleText("magenta", "compilerOptions")} section:`,
      ].join(""),
    );
    console.error(styleText("gray", `"compilerOptions": {`));
    console.error(styleText("cyan", `  "jsx": "preserve",`));
    console.error(styleText("cyan", `  "jsxImportSource": "solid-js",`));
    console.error(styleText("gray", "}"));
    console.error();
  }

  const customTemplates: Array<[Matcher, string]> = Object.entries({
    ...options.templates,
  }).map(([pattern, template]) => [picomatch(pattern), template]);

  const ssrGenerator = generators.some((e) => e.kind === "ssr");

  const entriesTraverser = traverseFactory(options);

  await mkdir(resolve("libDir", sourceFolder, "{solid}"), { recursive: true });

  await writeFile(
    resolve("libDir", sourceFolder, "{solid}/styles.module.css"),
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
    ["components/Link.tsx", publicComponentsLinkTpl],
    ["App.tsx", publicAppTpl],
    ["router.tsx", publicRouterTpl],
    [join(defaults.entryDir, "client.tsx"), publicEntryClientTpl],
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
          solid: join(sourceFolder, "{solid}"),
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
              styles: join(sourceFolder, "{solid}/styles.module.css"),
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
        routePartial: libSolidRoutePartialTpl,
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

    /**
     * Selecting api routes eligible for `useResource`.
     * Only considering api routes that handle GET requests without params.
     * */
    const apiRoutes = entries
      .flatMap(({ kind, entry }) => {
        if (kind !== "apiRoute") {
          return [];
        }

        if (!entry.methods.includes("GET")) {
          return [];
        }

        if (!entry.optionalParams) {
          return [];
        }

        return [
          {
            ...entry,
            importPathmap: {
              fetch: join(
                sourceFolder,
                defaults.apiLibDir,
                dirname(entry.file),
                "fetch",
              ),
            },
          },
        ];
      })
      .sort(sortRoutes);

    const shouldHydrate = JSON.stringify(
      ssrGenerator ? command === "build" : false,
    );

    const importPathmap = {
      config: join(sourceFolder, defaults.configDir),
      fetch: join(sourceFolder, defaults.fetchLibDir),
    };

    for (const [file, template] of [
      ["{solid}/index.ts", libSolidIndexTpl],
      ["{solid}/client.ts", libSolidClientTpl],
      ["{solid}/server.ts", libSolidServerTpl],
      ["{solid}/use.ts", libSolidUseTpl],
      [`${defaults.pagesLibDir}.ts`, libPagesTpl],
    ] as const) {
      await renderToFile(resolve("libDir", sourceFolder, file), template, {
        pageEntries,
        indexRoutes,
        nestedRoutes,
        apiRoutes,
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
