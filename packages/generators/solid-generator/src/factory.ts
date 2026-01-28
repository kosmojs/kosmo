import { access, constants } from "node:fs/promises";

import picomatch, { type Matcher } from "picomatch";

import {
  defaults,
  type GeneratorFactory,
  nestedRoutesFactory,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  sortRoutes,
} from "@kosmojs/dev";

import { randomCongratMessage, traverseFactory } from "./base";
import type { Options } from "./types";

import libEntryClientTpl from "./templates/lib/entry/client.hbs";
import libEntryRoutePartialTpl from "./templates/lib/entry/routePartial.hbs";
import libEntryServerTpl from "./templates/lib/entry/server.hbs";
import libPageSamplesPageTpl from "./templates/lib/pageSamples/page.hbs";
import libPageSamplesStylesTpl from "./templates/lib/pageSamples/styles.css?as=text";
import libPageSamplesWelcomeTpl from "./templates/lib/pageSamples/welcome.hbs";
import libRouterTpl from "./templates/lib/router.hbs";
import libSolidTpl from "./templates/lib/solid.hbs";
import libUnwrapTpl from "./templates/lib/unwrap.hbs";
import paramTpl from "./templates/param.hbs";
import srcAppTpl from "./templates/src/App.hbs";
import srcComponentsLinkTpl from "./templates/src/components/Link.hbs";
import srcEntryClientTpl from "./templates/src/entry/client.hbs";
import srcEntryServerTpl from "./templates/src/entry/server.hbs";
import srcIndexTpl from "./templates/src/index.html?as=text";
import srcPageSamplesLayoutTpl from "./templates/src/pageSamples/layout.hbs";
import srcPageSamplesPageTpl from "./templates/src/pageSamples/page.hbs";
import srcPageSamplesWelcomeTpl from "./templates/src/pageSamples/welcome.hbs";
import srcRouterTpl from "./templates/src/router.hbs";

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, generators, command },
  options,
) => {
  const { createPath, createImportHelper } = pathResolver({
    appRoot,
    sourceFolder,
  });

  const { render, renderToFile } = renderFactory({
    formatters,
    helpers: {
      createImport: createImportHelper,
    },
    partials: {
      routePartial: libEntryRoutePartialTpl,
    },
  });

  const customTemplates: Array<[Matcher, string]> = Object.entries({
    ...options.templates,
  }).map(([pattern, template]) => [picomatch(pattern), template]);

  const ssrGenerator = generators.some((e) => e.kind === "ssr");

  const entriesTraverser = traverseFactory(options);

  await renderToFile(createPath.lib("unwrap.ts"), libUnwrapTpl, {});

  for (const [file, template] of [
    ["styles.module.css", libPageSamplesStylesTpl],
    ["welcome.tsx", libPageSamplesWelcomeTpl],
    ["page.tsx", libPageSamplesPageTpl],
  ]) {
    await renderToFile(createPath.lib("pageSamples", file), template, {});
  }

  for (const [file, template] of [
    ["components/Link.tsx", srcComponentsLinkTpl],
    ["App.tsx", srcAppTpl],
    ["router.tsx", srcRouterTpl],
    ["index.html", srcIndexTpl],
  ]) {
    await renderToFile(
      createPath.src(file),
      template,
      { defaults },
      {
        // For index.html: overwrite only if empty or missing "<!--app-html-->".
        // For other files: overwrite only if blank.
        overwrite:
          file === "index.html"
            ? (c) => !c?.trim().length || !c?.includes("<!--app-html-->")
            : (c) => !c?.trim().length,
      },
    );
  }

  const overwrite = (content: string) => !content?.trim().length;

  for (const [file, template] of [
    ["client.tsx", srcEntryClientTpl],
    ...(ssrGenerator ? [["server.ts", srcEntryServerTpl]] : []),
  ]) {
    await renderToFile(createPath.entry(file), template, {}, { overwrite });
  }

  const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind === "pageRoute") {
        const customTemplate = customTemplates.find(([isMatch]) => {
          return isMatch(entry.name);
        });
        await renderToFile(
          createPath.pages(entry.file),
          entry.name === "index"
            ? srcPageSamplesWelcomeTpl
            : customTemplate?.[1] || srcPageSamplesPageTpl,
          { route: entry, message: randomCongratMessage() },
          { overwrite },
        );
      } else if (kind === "pageLayout") {
        await renderToFile(
          createPath.pages(entry.file),
          srcPageSamplesLayoutTpl,
          { route: entry },
          { overwrite },
        );
      }
    }
  };

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
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

        return [entry];
      })
      .sort(sortRoutes);

    const ssrMode = JSON.stringify(ssrGenerator ? command === "build" : false);

    for (const [file, template] of [
      ["client.ts", libEntryClientTpl],
      ["server.ts", libEntryServerTpl],
    ]) {
      await renderToFile(createPath.libEntry(file), template, {
        pageEntries,
        nestedRoutes,
      });
    }

    for (const [file, template] of [
      ["router.ts", libRouterTpl],
      ["solid.ts", libSolidTpl],
    ]) {
      await renderToFile(createPath.lib(file), template, {
        indexRoutes,
        apiRoutes,
        ssrMode,
      });
    }
  };

  return {
    async watch(entries, event) {
      // fill empty src files with proper content.
      // handle 2 cases:
      // - event is undefined (means initial call): process all routes
      // - `create` event given: process newly added route
      if (!event || event.kind === "create") {
        // always generateSrcFiles before generateLibFiles
        await generateSrcFiles(entries);
      }

      // Always regenerate index files to keep router in sync
      await generateLibFiles(entries);

      // TODO: handle `delete` event, cleanup lib files
    },
    async build(entries) {
      await generateSrcFiles(entries);
      await generateLibFiles(entries);
    },
  };
};

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
