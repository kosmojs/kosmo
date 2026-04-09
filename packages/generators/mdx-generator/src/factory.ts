import picomatch, { type Matcher } from "picomatch";

import type { PageRoute, ResolvedEntry } from "@kosmojs/core";
import { pageRouteRenderHelpers } from "@kosmojs/core/generators";
import {
  defaults,
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage } from "./base";
import * as templates from "./templates";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...pageRouteRenderHelpers(),
        serializeParams(route: PageRoute) {
          return JSON.stringify(route.params);
        },
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    const customTemplates: Array<[Matcher, string]> = Object.entries({
      ...options?.templates,
    }).map(([pattern, template]) => [picomatch(pattern), template]);

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
              title: entry.name.replace(/\{([^}]+)\}/g, "$1"),
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
      const layouts = entries.flatMap(({ kind, entry }) => {
        return kind === "pageLayout" ? [entry] : [];
      });

      const pageRoutes = entries
        .flatMap(({ kind, entry }) => {
          if (kind === "pageRoute") {
            const { name, file } = entry;
            return [
              {
                ...entry,
                layouts: layouts
                  .flatMap((e) => {
                    return e.name === name || file.startsWith(`${e.name}/`)
                      ? [e]
                      : [];
                  })
                  .sort(sortRoutes),
              },
            ];
          }
          return [];
        })
        .sort(sortRoutes);

      for (const [file, template] of [
        ["client.ts", templates.libEntryClient],
        ["server.ts", templates.libEntryServer],
      ]) {
        await deployLibFile(createPath.libEntry(file), template, {
          pageRoutes,
          layouts,
        });
      }

      for (const [file, template] of [
        ["router.ts", templates.libRouter],
        ["ssg:routes.ts", templates.libSsgRoutes],
      ]) {
        await deployLibFile(createPath.lib(file), template, { pageRoutes });
      }
    };

    return {
      meta,
      options,

      async start() {
        // deploy global lib files that does not change when routes updates
        for (const [file, template] of [
          ["env.d.ts", templates.libEnvD],
          ["mdx.ts", templates.libMdx],
          ["use.ts", templates.libUse],
          ["ssg.ts", templates.libSsg],
          ["pageSamples/styles.module.css", templates.libPageSamplesStyles],
          ["pageSamples/welcome.tsx", templates.libPageSamplesWelcome],
          ["pageSamples/page.tsx", templates.libPageSamplesPage],
          ["pageSamples/404.tsx", templates.libPageSamples404],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change when routes updates
        for (const [file, template] of [
          ["pages/404.mdx", templates.srcPageSamples404],
          ["components/Link.tsx", templates.srcComponentsLink],
          ["components/mdx.tsx", templates.srcComponentsMdx],
          ["App.mdx", templates.srcApp],
          ["router.tsx", templates.srcRouter],
        ] as const) {
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
          await generateSrcFiles(entries);
        }
        await generateLibFiles(entries);
      },

      async build(entries) {
        await generateSrcFiles(entries);
        await generateLibFiles(entries);
      },
    };
  },
);
