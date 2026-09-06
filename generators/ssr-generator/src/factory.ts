import { cp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { build } from "vite";

import { createRouteResolver, type SSROptions } from "@kosmojs/core";
import {
  defineGeneratorFactory,
  mergeConfigs,
  pathExists,
  pathResolver,
  renderFactory,
  sortRoutes,
  vitePlugins,
} from "@kosmojs/lib";

import * as templates from "./templates";

const RENDER_MODES = ["string", "stream"] as const;
const DEFAULT_RENDER_MODE = RENDER_MODES[0];

export default defineGeneratorFactory<SSROptions>((sourceFolder, options) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);
  const { frontend, generators } = sourceFolder.config;

  const { renderToFile: deployLibFile } = renderFactory({
    helpers: {
      ...createImportHelpers({ origin: "lib" }),
    },
  });

  return {
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
      };

      for (const [file, template] of [
        ["ssr.ts", templates.ssr],
        ["@ssr/__kosmo_ssr_bundle.ts", templates.ssrBundle],
        ["@ssr/routes.ts", templates.ssrRotues],
      ]) {
        await deployLibFile(createPath.lib(file), template, context);
      }
    },

    async postBuild() {
      if (!frontend) {
        // no frontend generator, nothing to build
        return;
      }

      const dir = createPath.distDir("ssr");

      const plugins = [
        vitePlugins.tsconfigPaths(sourceFolder),
        vitePlugins.nodePrefix(),
        vitePlugins.virtualModules(sourceFolder, {
          // The SSR graph is the only one that resolves the SSR side of every env-sensitive module -
          // the fetch transport, the query client.
          // The choice is made here, by the plugin, and never written to disk,
          // so the client build above and any concurrently running dev server keep the CSR variants,
          // no matter what order things run in.
          kind: "ssr",
          command: "build",
        }),
      ];

      // INFO: === Build the SSR client bundle using `entry/server` as the entry point ===
      await build(
        mergeConfigs(
          // user config - lowest priority
          frontend.viteConfig,
          // generators configs - higher priority
          ...generators.map(({ factory }) => {
            return factory(sourceFolder).viteConfig?.({
              kind: "client",
              command: "build",
            });
          }),
          // main config - highest priority
          {
            root: createPath.src(),
            plugins,
            build: {
              ssr: createPath.lib("@ssr/__kosmo_ssr_bundle"),
              ssrEmitAssets: true,
              sourcemap: true,
              emptyOutDir: true,
              minify: false,
              // public/ is copied into a dedicated subdir below, not into the bundle root
              copyPublicDir: false,
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

      // copy only what the SSR server uses from the client build, merging assets;
      // the client build root also holds public/ files, they get a dedicated subdir below
      for (const entry of [".vite", "assets", "index.html"]) {
        await cp(resolve(dir, "../client", entry), join(dir, entry), {
          recursive: true,
        });
      }

      // Same resolution vite applies to publicDir: relative to root, "public" by default,
      // disabled with false or an empty string.
      if (![false, ""].includes(frontend.viteConfig?.publicDir as never)) {
        const publicDir = resolve(
          createPath.src(),
          frontend.viteConfig?.publicDir || "public", // when undefined
        );
        if (await pathExists(publicDir)) {
          // served by the SSR server at base, the directory itself is the allowlist:
          // nothing else in the bundle root is ever exposed
          await cp(publicDir, join(dir, "public"), { recursive: true });
        }
      }

      for (const file of ["server.js", "server.js.map"]) {
        await cp(`${dir}/server/${file}`, `${dir}/${file}`);
      }

      await rm(`${dir}/server`, { recursive: true, force: true });
    },
  };
});
