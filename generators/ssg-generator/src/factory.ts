import { access, constants, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { styleText } from "node:util";

import { build } from "vite";

import type { FetchApp, PageRoute, ResolvedEntry } from "@kosmojs/core";
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

      // The SSR server module, used without a server: createApp returns a hono app,
      // and app.fetch runs the full request cycle in-process - no port, no listener, no loopback round-trip.
      // Loaders already take the in-process transport, so nothing in a render needs a socket.
      const { createApp } = (await import(ssrServerPath)) as {
        createApp: (
          errorHandler: (error: Error & { url: string }) => void,
        ) => Promise<FetchApp>;
      };

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
                { kind: "csr", command: "build" },
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

      try {
        const routes: Array<string> = await import(join(dir, "routes.js")).then(
          (e) => e.default,
        );

        // Rendered pages buffered by path; nothing touches the disk until every route rendered -
        // the output either materializes complete or not at all.
        const pages = new Map<string, { html: string } | { error: string }>();

        const app = await createApp((error) => {
          pages.set(new URL(error.url).pathname, { error: error.message });
        });

        for (const [i, route] of routes.entries()) {
          spinner.append(`[ ${i + 1} of ${routes.length} ] ${route}`);
          // Routes carry the base for fetching; the output tree is rooted at <base>,
          // same as vite's client build - deploy the folder at <base> on the host and the html,
          // assets/ and public files line up.
          try {
            const html = await fetchRoute(app, route);
            // A string-mode failure responds with the CSR shell and a 200 -
            // the render already reported it through the error handler above,
            // and that entry must not be overwritten by the shell html.
            if (!pages.has(route)) {
              pages.set(route, { html });
            }
          } catch (error) {
            if (!pages.has(route)) {
              pages.set(route, { error: String(error) });
            }
          }
        }

        const failed = [...pages.entries()].flatMap(([route, status]) => {
          return "error" in status ? [[route, status.error]] : [];
        });

        if (failed.length) {
          spinner.failed("failed ❗");
          // A quietly skipped route would ship an incomplete static site;
          // surface every broken route at once and fail the build.
          throw new Error(
            [
              `SSG: failed rendering ${failed.length} route(s):`,
              ...failed.map(([route, error]) => `  ${route} - ${error}`),
            ].join("\n"),
          );
        }

        // The routes bundle build emptied the output dir (vite derives outDir from the rolldown output dir),
        // so statics land only now, alongside the rendered pages.
        await cp(resolve(dir, "../ssr/assets"), join(dir, "assets"), {
          recursive: true,
        });

        // same for public dir
        const publicDir = resolve(dir, "../ssr/public");

        if (await pathExists(publicDir)) {
          await cp(publicDir, dir, { recursive: true });
        }

        for (const [route, page] of pages) {
          if ("html" in page) {
            const file = join(dir, posix.relative(base, route), "index.html");
            await mkdir(dirname(file), { recursive: true });
            await writeFile(file, page.html, "utf8");
          }
        }

        spinner.succeed("done ✨");
      } finally {
        await rm(`${dir}/routes.js`);
      }
    },
  };
});

const fetchRoute = async (app: FetchApp, path: string): Promise<string> => {
  // the host is a placeholder - hono only needs an absolute URL to parse;
  // the request never leaves the process
  const res = await app.fetch(new Request(`http://localhost${path}`));
  if (!res.ok) {
    // catching non-render errors, they never land into into errorHandler passed to createApp
    throw new Error(`app responded with ${res.status}`);
  }
  return res.text();
};
