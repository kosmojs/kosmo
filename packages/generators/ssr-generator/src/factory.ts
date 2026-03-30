import { rm } from "node:fs/promises";
import { join } from "node:path";

import { build } from "vite";

import {
  defaults,
  defineGeneratorFactory,
  type PageRoute,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import routesTpl from "./templates/lib/routes.hbs";
import serverTpl from "./templates/lib/server.ts?as=text";

export default defineGeneratorFactory((meta, sourceFolder) => {
  const { config } = sourceFolder;
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const { renderToFile: deployLibFile } = renderFactory({
    helpers: {
      ...createImportHelpers({ origin: "lib" }),
    },
  });

  return {
    meta,
    options: undefined,

    async start() {},
    async watch() {},

    async build(entries) {
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

        const { generators = [] } = config;

        const [mdxPlugins] = generators.flatMap(({ meta, factory }) => {
          return meta.slot === "mdx"
            ? [factory(sourceFolder).plugins("build")]
            : [];
        });

        await build({
          ...config,
          configFile: false,
          root: createPath.src(),
          plugins: [...(mdxPlugins || []), ...(config.plugins || [])],
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
        ["@ssr/routes.ts", routesTpl],
      ]) {
        await deployLibFile(createPath.lib(file), template, {
          sortedRoutes,
        });
      }

      // Build default server for SSR. It is using node:http server.
      // For custom deployment, use the app factory directly and discard the built server.
      await build({
        configFile: false,
        root: createPath.lib(),
        appType: "custom",
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
    },

    plugins() {
      return [];
    },
  };
});
