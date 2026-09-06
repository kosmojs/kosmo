import vitePlugin from "@mdx-js/rollup";
import frontmatterPlugin from "remark-frontmatter";
import mdxFrontmatterPlugin from "remark-mdx-frontmatter";

import {
  createTemplateResolver,
  defaults,
  type PageRoute,
  type ResolvedEntry,
} from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  createWatchedPageRouteEntriesFilter,
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
  sortRoutesForResolution,
} from "@kosmojs/lib";

import { randomCongratMessage } from "./base";
import builtinPlugins from "./plugins";
import * as templates from "./templates";

export default defineGeneratorFactory((sourceFolder) => {
  const { frontend } = sourceFolder.config;
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const { renderToFile: deployLibFile } = renderFactory({
    helpers: {
      ...createImportHelpers({ origin: "lib" }),
      ...routeRenderHelpers(),
      serializeParams(route: PageRoute) {
        return JSON.stringify(route.params);
      },
    },
  });

  const { renderToFile: deploySrcFile } = renderFactory({
    helpers: createImportHelpers({ origin: "src" }),
  });

  const overwrite = (content: string) => !content?.trim().length;

  const templateResolver = createTemplateResolver(
    frontend?.templates,
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
      .sort(sortRoutesForResolution);

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
    viteConfig({ command }) {
      const defaultPlugin = () => {
        return vitePlugin({
          jsxImportSource: "preact",
          providerImportSource: "@mdx-js/preact",
          remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin],
        });
      };

      const { plugin = defaultPlugin() } =
        typeof sourceFolder.config.frontend?.stack === "object"
          ? sourceFolder.config.frontend.stack
          : {};

      return {
        oxc: { jsx: { runtime: "automatic", importSource: "preact" } },
        plugins: [plugin, ...builtinPlugins(sourceFolder, command)],
      };
    },

    async start() {
      // deploy global lib files that does not change when routes updates
      for (const [file, template] of [
        ["env.d.ts", templates.libEnvD],
        ["app.ts", templates.libApp],
        ["mdx.ts", templates.libMdx],
        ["use.ts", templates.libUse],
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
        ["components/mdx.ts", templates.srcComponentsMdx],
        ["app.mdx", templates.srcApp],
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
  };
});
