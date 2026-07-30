import { svelte } from "@sveltejs/vite-plugin-svelte";

import {
  createTemplateResolver,
  defaults,
  type GeneratorFactory,
  type ResolvedEntry,
} from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage } from "./base";
import * as templates from "./templates";
import type { Options } from "./types";

/**
 * The explicit `GeneratorFactory<Options>` annotation is load-bearing, not
 * decoration. Without it, declaration emit infers and *expands* the type,
 * which reaches into vite-plugin-svelte's `Options` - an intersection with
 * `PluginOptionsInline`, a name that package does not export - and fails with
 * TS4082 "using private name". Annotating makes tsc emit the alias by name
 * instead of expanding it.
 * */
const factory: GeneratorFactory<Options> = defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...routeRenderHelpers(),
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    const overwrite = (content: string) => !content?.trim().length;

    const templateResolver = createTemplateResolver(
      options?.templates,
      templates.srcPageSamplesPage,
    );

    const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
      for (const { kind, entry } of entries) {
        if (kind === "pageRoute") {
          await deploySrcFile(
            createPath.pages(entry.file),
            entry.name === "index"
              ? templates.srcPageSamplesWelcome
              : templateResolver(entry.name, entry),
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
        ["params.ts", templates.libParams],
        ["router.ts", templates.libRouter],
      ]) {
        await deployLibFile(createPath.lib(file), template, { pageRoutes });
      }
    };

    return {
      meta,
      options,

      config() {
        const { templates, ...opts } = { ...options };
        return {
          plugins: svelte(opts),
        };
      },

      async start() {
        // deploy global lib files that does not change when routes updates
        for (const [file, template] of [
          ["env.d.ts", templates.libEnvD],
          ["svelte.ts", templates.libSvelte],
          ["Layouts.svelte", templates.libLayouts],
          ["use.ts", templates.libUse],
          ["pageSamples/styles.module.css", templates.libPageSamplesStyles],
          ["pageSamples/welcome.svelte", templates.libPageSamplesWelcome],
          ["pageSamples/page.svelte", templates.libPageSamplesPage],
          ["pageSamples/404.svelte", templates.libPageSamples404],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change when routes updates
        for (const [file, template] of [
          ["pages/404.svelte", templates.srcPageSamples404],
          ["components/Link.svelte", templates.srcComponentsLink],
          ["App.svelte", templates.srcApp],
          ["router.ts", templates.srcRouter],
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
          ["client.ts", templates.srcEntryClient],
          ["server.ts", templates.srcEntryServer],
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

export default factory;
