import { cp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { build } from "vite";

import { createRouteResolver } from "@kosmojs/core";
import {
  defineGeneratorFactory,
  mergeConfigs,
  pathResolver,
  renderFactory,
  sortRoutes,
  vitePlugins,
} from "@kosmojs/lib";

import * as templates from "./templates";
import type { Options } from "./types";

const RENDER_MODES = ["string", "stream"] as const;
const DEFAULT_RENDER_MODE = RENDER_MODES[0];

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { generators = [], refineTypeName, ...config } = sourceFolder.config;

    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
      },
    });

    return {
      meta,
      options,

      async build(entries) {
        const renderModeResolver = options?.renderMode
          ? typeof options.renderMode === "string"
            ? () => options.renderMode
            : createRouteResolver(options?.renderMode as never, "string")
          : () => DEFAULT_RENDER_MODE;

        const context = {
          renderMode: JSON.stringify(options?.renderMode || null),
          pageRoutes: entries
            .flatMap((e) => {
              return e.kind === "pageRoute"
                ? [
                    {
                      ...e.entry,
                      renderMode: renderModeResolver(e.entry.name),
                    },
                  ]
                : [];
            })
            .sort(sortRoutes),
          apiGenerator: generators.some((e) => e.meta.slot === "api"),
        };

        for (const [file, template] of [
          ["ssr.ts", templates.ssr],
          ["@ssr/api.ts", templates.ssrApi],
          ["@ssr/app.ts", templates.ssrApp],
          ["@ssr/base.ts", templates.ssrBase],
          ["@ssr/fetch.ts", templates.ssrFetch],
          ["@ssr/routes.ts", templates.ssrRotues],
        ]) {
          await deployLibFile(createPath.lib(file), template, context);
        }
      },

      async postBuild() {
        const dir = createPath.distDir("ssr");

        const plugins = [
          vitePlugins.tsconfigPaths(sourceFolder),
          vitePlugins.nodePrefix(),
        ];

        // INFO: === Build the SSR client bundle using `entry/server` as the entry point ===
        await build(
          mergeConfigs(
            // user config - lowest priority
            config,
            // generators configs - higher priority
            ...generators.map(({ factory }) => {
              return factory(sourceFolder).config?.({
                kind: "client",
                command: "build",
              });
            }),
            // main config - highest priority
            {
              root: createPath.src(),
              plugins,
              define: {
                KOSMO_PRODUCTION_BUILD: "true",
                KOSMO_SERVERSIDE_FETCH: "true",
              },
              build: {
                ssr: createPath.lib("@ssr/app"),
                ssrEmitAssets: true,
                sourcemap: true,
                emptyOutDir: true,
                minify: false,
                rolldownOptions: {
                  output: {
                    dir,
                    entryFileNames: "app.js",
                    format: "esm",
                  },
                },
              },
            },
          ),
        );

        // INFO: === Build the SSR server using `lib/ssr.ts` ===
        // no config merge needed here
        await build({
          root: createPath.lib(),
          configFile: false,
          appType: "custom",
          plugins,
          resolve: {
            conditions: ["node"],
          },
          build: {
            ssr: createPath.lib("ssr.ts"),
            target: "esnext",
            sourcemap: true,
            emptyOutDir: true,
            rolldownOptions: {
              output: {
                // emit to a subdir for emptyOutDir to not wipe just built app.js and assets
                dir: join(dir, "server"),
                entryFileNames: "server.js",
                format: "esm",
              },
            },
          },
        });

        // copy client files into ssr dir, merging assets
        await cp(resolve(dir, "../client"), dir, {
          recursive: true,
        });

        for (const file of ["server.js", "server.js.map"]) {
          await cp(`${dir}/server/${file}`, `${dir}/${file}`);
        }

        await rm(`${dir}/server`, { recursive: true, force: true });
      },
    };
  },
);
