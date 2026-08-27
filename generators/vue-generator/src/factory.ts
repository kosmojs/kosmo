import vitePlugin from "@vitejs/plugin-vue";

import {
  createTemplateResolver,
  defaults,
  type ResolvedEntry,
} from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  createWatchedPageRouteEntriesFilter,
  defineGeneratorFactory,
  nestedRoutesFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import { randomCongratMessage, traverseFactory } from "./base";
import * as templates from "./templates";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>((sourceFolder, options) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const { renderToFile: deployLibFile } = renderFactory({
    helpers: {
      ...createImportHelpers({ origin: "lib" }),
      ...routeRenderHelpers(),
    },
    partials: {
      routePartial: templates.libEntryRoutePartial,
    },
  });

  const { renderToFile: deploySrcFile } = renderFactory({
    helpers: createImportHelpers({ origin: "src" }),
  });

  const entriesTraverser = traverseFactory();

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
          { route: entry, message: randomCongratMessage() },
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
        lazyLoad: file === "client.ts",
      });
    }

    await deployLibFile(createPath.lib("router.ts"), templates.libRouter, {
      entries,
      indexRoutes,
    });
  };

  return {
    config() {
      const { templates, ...opts } = { ...options };
      return {
        plugins: [vitePlugin(opts)],
      };
    },

    async start() {
      // deploy global lib files that does not change on routes updates
      for (const [file, template] of [
        ["env.d.ts", templates.libEnvD],
        ["unwrap.ts", templates.libUnwrap],
        ["use.ts", templates.libUse],
        ["pageSamples/styles.module.css", templates.libPageSamplesStyles],
        ["pageSamples/welcome.vue", templates.libPageSamplesWelcome],
        ["pageSamples/page.vue", templates.libPageSamplesPage],
        ["pageSamples/404.vue", templates.libPageSamples404],
        ["app/provider.vue", templates.libAppProvider],
        ...(options?.tanstack?.query
          ? [
              ["app/index.ts", templates.libAppTsq],
              ["query.ts", templates.libQuery],
            ]
          : [
              ["app/index.ts", templates.libApp],
              ["query.ts", "/** tanstack query disabled */"],
            ]),
      ]) {
        await deployLibFile(createPath.lib(file), template, {});
      }

      // deploy global src files that does not change on routes updates
      for (const [file, template] of [
        ["pages/404.vue", templates.srcPageSamples404],
        ["components/Link.vue", templates.srcComponentsLink],
        ["app.vue", templates.srcApp],
        ["router.ts", templates.srcRouter],
      ]) {
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

      // Always regenerate index files to keep router in sync
      await generateLibFiles(entries);

      // TODO: handle `delete` event, cleanup lib files
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
