import { rm } from "node:fs/promises";

import { build } from "vite";

import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
  vitePlugins,
} from "@kosmojs/lib";

import type { Options } from "./options";
import * as templates from "./templates";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const {
      generators = [],
      refineTypeName,
      ...config
    } = { ...sourceFolder.config };
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
      },
    });

    const noExternal = Array.isArray(options?.noExternal)
      ? options.noExternal
      : [...generators, { meta }].flatMap(({ meta }) => {
          return Object.keys({
            ...meta.dependencies,
            ...meta.devDependencies,
          });
        });

    return {
      meta,
      options: undefined,

      async start() {},
      async watch() {},

      async build(entries) {
        await deployLibFile(
          createPath.lib("ssr:routes.ts"),
          templates.ssrRotues,
          {
            pageRoutes: entries
              .flatMap((e) => (e.kind === "pageRoute" ? [e.entry] : []))
              .sort(sortRoutes),
          },
        );

        await deployLibFile(createPath.lib("ssr.ts"), templates.ssr, {
          serveStaticAssets: JSON.stringify(
            typeof options?.serveStaticAssets === "boolean"
              ? options.serveStaticAssets
              : true,
          ),
        });

        // build the SSR bundle using `entry/server.ts` as the entry point.
        {
          const outDir = createPath.distDir("ssr");

          // emptyOutDir wont work cause dir is outside project root
          await rm(outDir, { recursive: true, force: true });

          const plugins = [
            vitePlugins.nodePrefix(),
            ...(config?.plugins || []),
          ];

          for (const base of generators) {
            plugins.push(...(base.plugins?.(sourceFolder, "build") || []));
          }

          await build({
            ...config,
            configFile: false,
            root: createPath.src(),
            plugins,
            ssr: { noExternal },
            resolve: {
              ...config.resolve,
              tsconfigPaths: true,
            },
            build: {
              // do not use extension here, it may vary by framework
              ssr: createPath.entry("server"),
              ssrEmitAssets: true,
              outDir,
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

        // Build default server for SSR. It is using node:http server.
        // For custom deployment, use the app factory directly and discard the built server.
        await build({
          configFile: false,
          root: createPath.lib(),
          appType: "custom",
          plugins: [vitePlugins.nodePrefix()],
          define: { ...config.define },
          ssr: { noExternal },
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
    };
  },
);
