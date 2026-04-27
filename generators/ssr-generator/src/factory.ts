import { cp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { build } from "vite";

import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
  vitePlugins,
} from "@kosmojs/lib";

import * as templates from "./templates";
import type { Options } from "./types";

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
      options,

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
      },

      async postBuild() {
        const dir = createPath.distDir("ssr");

        const plugins = [vitePlugins.nodePrefix(), ...(config?.plugins || [])];

        for (const base of generators) {
          plugins.push(...(base.plugins?.(sourceFolder, "build") || []));
        }

        // build the SSR bundle using `entry/server` as the entry point.
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
            sourcemap: true,
            emptyOutDir: true,
            rolldownOptions: {
              output: {
                dir,
                entryFileNames: "app.js",
                format: "esm",
              },
            },
          },
        });

        // Build the SSR server using `lib/ssr.ts`
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
            ssr: createPath.lib("ssr.ts"),
            target: "esnext",
            sourcemap: true,
            emptyOutDir: true,
            rolldownOptions: {
              output: {
                // emit to a subdir for emptyOutDir to not wipe built client
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
