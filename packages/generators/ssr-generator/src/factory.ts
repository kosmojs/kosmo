import { rm } from "node:fs/promises";

import { build } from "vite";

import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
} from "@kosmojs/lib";

import type { Options } from "./options";

import serverTpl from "./templates/lib/server.ts?as=text";

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

    return {
      meta,
      options: undefined,

      async start() {},
      async watch() {},

      async build() {
        await deployLibFile(createPath.lib("ssr.ts"), serverTpl, {
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

          const plugins = [...(config.plugins || [])];

          for (const base of generators) {
            const factory = base.factory(sourceFolder);
            plugins.push(...factory.plugins("build"));
          }

          await build({
            ...config,
            configFile: false,
            root: createPath.src(),
            plugins,
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
          define: {
            ...config.define,
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
  },
);
