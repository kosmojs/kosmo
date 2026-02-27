import { join } from "node:path";

import { type BuildOptions, build as esbuild } from "esbuild";
import { build, loadConfigFromFile, type Plugin } from "vite";

import {
  defaults,
  type GeneratorFactory,
  type PageRoute,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  sortRoutes,
} from "@kosmojs/dev";

import routesTpl from "./templates/routes.hbs";
import serverTpl from "./templates/server.ts?as=text";

export const factory: GeneratorFactory = async ({
  appRoot,
  sourceFolder,
  outDir,
}) => {
  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { createPath, createImportHelper } = pathResolver({
      appRoot,
      sourceFolder,
    });

    const { renderToFile } = renderFactory({
      helpers: {
        createImport: createImportHelper,
      },
    });

    const routes = entries.flatMap(({ kind, entry }) => {
      return kind === "pageRoute" ? [entry] : [];
    });

    const layouts = entries.flatMap(({ kind, entry }) => {
      return kind === "pageLayout" ? [entry] : [];
    });

    const viteConfig = await loadConfigFromFile(
      { command: "build", mode: "ssr" },
      createPath.src("vite.config.ts"),
    );

    const esbuildOptions: BuildOptions = await import(
      join(appRoot, "esbuild.json"),
      { with: { type: "json" } }
    ).then((e) => e.default);

    const { plugins, ...config } = { ...viteConfig?.config };

    // build the SSR bundle using `entry/server.ts` as the entry point.
    // NOTE: this file is deployed by userland generators,
    // therefore the SSR generator must run last to ensure this file exists.
    await build({
      configFile: false,
      ...config,
      // WARN: excluding basePlugin is essential to avoid an infinite build loop.
      plugins: plugins
        ? plugins.filter((e) => (e as Plugin)?.name !== "@kosmojs:basePlugin")
        : [],
      build: {
        ssr: createPath.entry("server.ts"),
        ssrEmitAssets: false,
        outDir: join(outDir, "ssr"),
        emptyOutDir: true,
        sourcemap: true,
        // TODO: review this option when Vite switched to Rolldown
        rollupOptions: {
          output: {
            entryFileNames: "app.js",
          },
        },
      },
    });

    const sortedRoutes: Array<PageRoute & { layouts: Array<string> }> = routes
      .map((route) => {
        return {
          ...route,
          file: join(defaults.pagesDir, route.file),
          layouts: layouts.flatMap(({ name, file }) => {
            return name === route.name || route.file.startsWith(`${name}/`)
              ? [join(defaults.pagesDir, file)]
              : [];
          }),
        };
      }, {})
      .sort(sortRoutes);

    for (const [file, template] of [
      ["ssr.ts", serverTpl],
      ["ssr:routes.ts", routesTpl],
    ]) {
      await renderToFile(createPath.lib(file), template, {
        sortedRoutes,
      });
    }

    // Build default server for SSR. It is using node:http server.
    // For custom deployment, use the app factory directly and discard the built server.
    await esbuild({
      ...esbuildOptions,
      bundle: true,
      entryPoints: [createPath.lib("ssr.ts")],
      outfile: join(outDir, "ssr", "server.js"),
    });
  };

  return {
    async watch() {},
    async build(entries) {
      await generateLibFiles(entries);
    },
  };
};
