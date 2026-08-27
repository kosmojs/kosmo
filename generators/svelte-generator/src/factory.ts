import { svelte } from "@sveltejs/vite-plugin-svelte";

import {
  createTemplateResolver,
  defaults,
  type ResolvedEntry,
} from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  createWatchedPageRouteEntriesFilter,
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage } from "./base";
import * as templates from "./templates";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>((sourceFolder, options) => {
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
        ...(options?.tanstack?.query
          ? [
              ["app/app.svelte", templates.libApp],
              ["app/app-tsq.svelte", templates.libAppTsq],
              [
                "app/index.ts",
                `export { default as AppProvider } from "./app-tsq.svelte";`,
              ],
              ["query.ts", templates.libQuery],
            ]
          : [
              ["app/app.svelte", templates.libApp],
              ["app/app-tsq.svelte", "/** tanstack query disabled */"],
              [
                "app/index.ts",
                `export { default as AppProvider } from "./app.svelte";`,
              ],
              ["query.ts", "/** tanstack query disabled */"],
            ]),
      ]) {
        await deployLibFile(createPath.lib(file), template, {});
      }

      // deploy global src files that does not change when routes updates
      for (const [file, template] of [
        ["pages/404.svelte", templates.srcPageSamples404],
        ["components/Link.svelte", templates.srcComponentsLink],
        ["app.svelte", templates.srcApp],
        ["router.ts", templates.srcRouter],
      ] as const) {
        await deploySrcFile(
          createPath.src(file),
          template,
          { entryDir: defaults.entryDir },
          { overwrite },
        );
      }

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
      // always generateSrcFiles before generateLibFiles.
      await generateSrcFiles(
        entries.filter(createWatchedPageRouteEntriesFilter(event, ["create"])),
      );

      await generateLibFiles(entries);
    },

    async build(entries) {
      await generateSrcFiles(entries);
      await generateLibFiles(entries);
    },

    async ssrBuild() {
      await deployLibFile(
        createPath.lib("query.ts"),
        options?.tanstack?.query
          ? templates.libQuerySSR
          : "/** tanstack query disabled */",
        { ssrBundle: true },
      );
    },
  };
});
