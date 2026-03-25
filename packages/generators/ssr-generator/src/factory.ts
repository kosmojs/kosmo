import { rm } from "node:fs/promises";
import { join } from "node:path";

import { build } from "vite";

import {
  defaults,
  type GeneratorFactory,
  type PageRoute,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import routesTpl from "./templates/routes.hbs";
import serverTpl from "./templates/server.ts?as=text";

export const factory: GeneratorFactory = async (sourceFolder) => {
  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { config } = sourceFolder;
    const { createPath, createImportHelper } = pathResolver(sourceFolder);

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

    // build the SSR bundle using `entry/server.ts` as the entry point.
    {
      const outDir = createPath.distDir("ssr");
      // emptyOutDir wont work cause dir is outside project root
      await rm(outDir, { recursive: true, force: true });
      await build({
        ...config,
        configFile: false,
        root: createPath.src(),
        define: {
          ...config.define,
          KOSMO_SSR_MODE: "true",
        },
        resolve: {
          ...config.resolve,
          tsconfigPaths: true,
        },
        build: {
          ssr: createPath.entry("server.ts"),
          outDir,
          ssrEmitAssets: false,
          sourcemap: true,
          rolldownOptions: {
            output: {
              entryFileNames: "app.js",
              format: "esm",
            },
          },
        },
      });
    }
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
    await build({
      configFile: false,
      root: createPath.lib(),
      appType: "custom",
      plugins: config.plugins || [],
      define: {
        ...config.define,
        KOSMO_SSR_MODE: "true",
      },
      resolve: {
        ...config.resolve,
        tsconfigPaths: true,
        conditions: ["node"],
      },
      build: {
        ssr: true,
        target: "esnext",
        sourcemap: true,
        rolldownOptions: {
          input: [createPath.lib("ssr.ts")],
          output: {
            dir: createPath.distDir("ssr"),
            entryFileNames: "server.js",
            format: "esm",
          },
        },
      },
    });
  };

  return {
    async watch() {},
    async build(entries) {
      await generateLibFiles(entries);
    },
  };
};
