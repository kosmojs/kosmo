import picomatch, { type Matcher } from "picomatch";

import type { ResolvedEntry } from "@kosmojs/core";
import { pageRouteRenderHelpers } from "@kosmojs/core/generators";
import {
  defaults,
  defineGeneratorFactory,
  nestedRoutesFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage, traverseFactory } from "./base";
import * as templates from "./templates";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...pageRouteRenderHelpers(),
      },
      partials: {
        routePartial: templates.libEntryRoutePartial,
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    const customTemplates: Array<[Matcher, string]> = Object.entries({
      ...options?.templates,
    }).map(([pattern, template]) => [picomatch(pattern), template]);

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
              ? templates.srcPageSamplesWelcome
              : customTemplate?.[1] || templates.srcPageSamplesPage,
            {
              route: entry,
              message: randomCongratMessage(),
            },
            { overwrite },
          );
        } else if (kind === "pageLayout") {
          await deploySrcFile(
            createPath.pages(entry.file),
            templates.srcPageSamplesLayout,
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
        ["client.ts", templates.libEntryClient],
        ["server.ts", templates.libEntryServer],
      ]) {
        await deployLibFile(createPath.libEntry(file), template, {
          pageEntries,
          nestedRoutes,
        });
      }

      await deployLibFile(createPath.lib("router.ts"), templates.libRouter, {
        entries,
        indexRoutes,
      });
    };

    return {
      meta,
      options,

      async start() {
        // deploy global lib files that does not change on routes updates
        for (const [file, template] of [
          ["env.d.ts", templates.libEnvD],
          ["solid.ts", templates.libSolid],
          ["unwrap.ts", templates.libUnwrap],
          ["pageSamples/styles.module.css", templates.libPageSamplesStyles],
          ["pageSamples/welcome.tsx", templates.libPageSamplesWelcome],
          ["pageSamples/page.tsx", templates.libPageSamplesPage],
          ["pageSamples/404.tsx", templates.libPageSamples404],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change on routes updates
        for (const [file, template] of [
          ["pages/404.tsx", templates.srcPageSamples404],
          ["components/Link.tsx", templates.srcComponentsLink],
          ["App.tsx", templates.srcApp],
          ["router.tsx", templates.srcRouter],
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
          templates.srcIndex,
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
          ["client.tsx", templates.srcEntryClient],
          ["server.tsx", templates.srcEntryServer],
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
