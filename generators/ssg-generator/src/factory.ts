import { access, constants, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { styleText } from "node:util";

import { build } from "vite";

import type { PageRoute, ResolvedEntry } from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  collectVirtualModules,
  defineGeneratorFactory,
  mergeConfigs,
  pathExists,
  pathResolver,
  renderFactory,
  sortRoutes,
  spinnerFactory,
  vitePlugins,
} from "@kosmojs/lib";

import * as templates from "./templates";

export default defineGeneratorFactory((sourceFolder) => {
  const {
    generators = [],
    refineTypeName,
    ...config
  } = { ...sourceFolder.config };

  const { base } = config;

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

  // the routes table imports every page module, whatever the framework -
  // ssg.ts reads `staticParams` off each one at build time
  const generateRoutes = async (entries: Array<ResolvedEntry>) => {
    const pageRoutes = entries
      .flatMap(({ kind, entry }) => {
        return kind === "pageRoute" ? [entry] : [];
      })
      .sort(sortRoutes);

    await deployLibFile(
      createPath.lib("ssg:routes.ts"),
      templates.libSsgRoutes,
      { pageRoutes },
    );
  };

  return {
    async start() {
      await deployLibFile(createPath.lib("ssg.ts"), templates.libSsg, {});
    },

    async watch(entries) {
      await generateRoutes(entries);
    },

    async build(entries) {
      await generateRoutes(entries);
    },

    async postBuild() {
      const dir = createPath.distDir("ssg");

      const ssrServerPath = resolve(dir, "../ssr/server.js");

      const ssrServerExists = await access(ssrServerPath, constants.F_OK).then(
        () => true,
        () => false,
      );

      if (!ssrServerExists) {
        console.error();
        console.error(
          styleText(
            "red",
            `❗Please enable ssrGenerator in ${sourceFolder.name}/kosmo.config.ts`,
          ),
        );
        console.error("  SSG generator can not run without SSR server");
        console.error();
        return;
      }

      const spinner = spinnerFactory(`${sourceFolder.name}: SSG`);

      spinner.append("preparing...");

      const { createDisposableServer } = await import(ssrServerPath);

      spinner.append("bundling routes...");

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
            root: createPath.lib(),
            appType: "custom",
            plugins: [
              vitePlugins.tsconfigPaths(sourceFolder),
              vitePlugins.nodePrefix(),
              // routes bundle, not the SSR graph - client variants apply
              vitePlugins.virtualModules(
                collectVirtualModules(sourceFolder, generators),
                { kind: "csr" },
              ),
            ],
            resolve: {
              conditions: ["node"],
            },
            build: {
              ssr: createPath.lib("ssg.ts"),
              target: "esnext",
              sourcemap: false,
              emptyOutDir: true,
              rolldownOptions: {
                output: {
                  dir,
                  entryFileNames: "routes.js",
                  format: "esm",
                },
              },
            },
          },
        ),
      );

      // The routes bundle build above emptied the output dir (vite derives outDir from the rolldown output dir),
      // so statics are copied only now, once it is done.
      // The output is a complete static site: the ssr folder holds the merged assets/
      // (client bundle plus SSR-emitted CSS the rendered html links to)
      // and public/, copied to the root, where a static host expects public files.
      await cp(resolve(dir, "../ssr/assets"), join(dir, "assets"), {
        recursive: true,
      });

      const publicDir = resolve(dir, "../ssr/public");

      if (await pathExists(publicDir)) {
        await cp(publicDir, dir, { recursive: true });
      }

      try {
        const routes: Array<string> = await import(join(dir, "routes.js")).then(
          (e) => e.default,
        );

        createDisposableServer(async (port: number) => {
          for (const [i, route] of routes.entries()) {
            spinner.append(`[ ${i + 1} of ${routes.length} ] ${route}`);
            const html = await fetchRoute(port, route);
            if (html === undefined) {
              continue;
            }
            // Routes carry the base for fetching; the output tree is rooted at base,
            // same as vite's client build - deploy the folder at <base> on the host and the html,
            // assets/ and public files line up.
            const file = join(dir, posix.relative(base, route), "index.html");
            await mkdir(dirname(file), { recursive: true });
            await writeFile(file, html, "utf8");
          }

          spinner.succeed("done ✨");
        });
      } finally {
        await rm(`${dir}/routes.js`);
      }
    },
  };
});

const fetchRoute = async (port: number, path: string) => {
  try {
    const url = `http://localhost:${port}${path}`;
    const res = await fetch(url);
    const html = await res.text();
    return html;
  } catch (
    // biome-ignore lint: any
    error: any
  ) {
    console.error(
      styleText(
        "red",
        `✗ SSG: Failed generating ${path} route: ${error.message}`,
      ),
    );
    return;
  }
};
