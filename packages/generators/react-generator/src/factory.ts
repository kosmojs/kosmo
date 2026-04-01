import picomatch, { type Matcher } from "picomatch";

import type { PageRoute, ResolvedEntry } from "@kosmojs/core";
import {
  defaults,
  defineGeneratorFactory,
  nestedRoutesFactory,
  pathResolver,
  renderFactory,
  renderHelpers,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage, traverseFactory } from "./base";
import type { Options } from "./types";

import libEntryClientTpl from "./templates/lib/entry/client.hbs";
import libEntryRoutePartialTpl from "./templates/lib/entry/routePartial.hbs";
import libEntryServerTpl from "./templates/lib/entry/server.hbs";
import libEnvDTpl from "./templates/lib/env.d.ts?as=text";
import libPageSamplesPageTpl from "./templates/lib/pageSamples/page.hbs";
import libPageSamplesStylesTpl from "./templates/lib/pageSamples/styles.css?as=text";
import libPageSamplesWelcomeTpl from "./templates/lib/pageSamples/welcome.hbs";
import libReactTpl from "./templates/lib/react.ts?as=text";
import libRouterTpl from "./templates/lib/router.hbs";
import srcAppTpl from "./templates/src/App.hbs";
import srcComponentsLinkTpl from "./templates/src/components/Link.hbs";
import srcEntryClientTpl from "./templates/src/entry/client.hbs";
import srcEntryServerTpl from "./templates/src/entry/server.hbs";
import srcIndexTpl from "./templates/src/index.html?as=text";
import srcPageSamplesLayoutTpl from "./templates/src/pageSamples/layout.hbs";
import srcPageSamplesPageTpl from "./templates/src/pageSamples/page.hbs";
import srcPageSamplesWelcomeTpl from "./templates/src/pageSamples/welcome.hbs";
import srcRouterTpl from "./templates/src/router.hbs";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        createParamsLiteral: renderHelpers.createParamsLiteral,
        serializeRoute({ name, pathPattern, params }: PageRoute) {
          return JSON.stringify({ name, pathPattern, params });
        },
      },
      partials: {
        routePartial: libEntryRoutePartialTpl,
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    const customTemplates: Array<[Matcher, string]> = Object.entries({
      ...options?.templates,
    }).map(([pattern, template]) => [picomatch(pattern), template]);

    const { generators = [] } = sourceFolder.config;

    const ssrGenerator = generators.some(({ meta }) => meta.slot === "ssr");

    const entriesTraverser = traverseFactory();

    const overwrite = (content: string) => !content?.trim().length;

    const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
      for (const { kind, entry } of entries) {
        if (kind === "pageRoute") {
          const customTemplate = customTemplates.find(([isMatch]) => {
            return isMatch(entry.name);
          });
          await deploySrcFile(
            createPath.pages(entry.file),
            entry.name === "index"
              ? srcPageSamplesWelcomeTpl
              : customTemplate?.[1] || srcPageSamplesPageTpl,
            {
              route: entry,
              message: randomCongratMessage(),
            },
            { overwrite },
          );
        } else if (kind === "pageLayout") {
          await deploySrcFile(
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
          return kind === "pageRoute" ? [entry] : [];
        })
        .sort(sortRoutes);

      const pageEntries = entries.flatMap(({ kind, entry }) => {
        return kind === "pageRoute" || kind === "pageLayout" ? [entry] : [];
      });

      const nestedRoutes = entriesTraverser(nestedRoutesFactory(pageEntries));

      for (const [file, template] of [
        ["client.ts", libEntryClientTpl],
        ["server.ts", libEntryServerTpl],
      ]) {
        await deployLibFile(createPath.libEntry(file), template, {
          pageEntries,
          nestedRoutes,
        });
      }

      for (const [file, template] of [
        //
        ["router.ts", libRouterTpl],
      ]) {
        await deployLibFile(createPath.lib(file), template, { indexRoutes });
      }
    };

    return {
      meta,
      options,

      async start() {
        // deploy global lib files that does not change on routes updates
        for (const [file, template] of [
          ["env.d.ts", libEnvDTpl],
          ["react.ts", libReactTpl],
          ["pageSamples/styles.module.css", libPageSamplesStylesTpl],
          ["pageSamples/welcome.tsx", libPageSamplesWelcomeTpl],
          ["pageSamples/page.tsx", libPageSamplesPageTpl],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change when routes updates
        for (const [file, template] of [
          ["components/Link.tsx", srcComponentsLinkTpl],
          ["App.tsx", srcAppTpl],
          ["router.tsx", srcRouterTpl],
        ]) {
          await deploySrcFile(
            createPath.src(file),
            template,
            { entryDir: defaults.entryDir },
            { overwrite },
          );
        }

        await deploySrcFile(
          createPath.src("index.html"),
          srcIndexTpl,
          { entryDir: defaults.entryDir },
          {
            overwrite: (c) => {
              // override only if file is blank or contains only comments
              return c?.trim().length
                ? !c.replace(/<!--[\s\S]*?-->/g, "").trim().length
                : true;
            },
          },
        );

        for (const [file, template] of [
          ["client.tsx", srcEntryClientTpl],
          ...(ssrGenerator ? [["server.ts", srcEntryServerTpl]] : []),
        ]) {
          await deploySrcFile(
            createPath.entry(file),
            template,
            {},
            { overwrite },
          );
        }
      },

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

      plugins() {
        return [];
      },
    };
  },
);
