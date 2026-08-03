import { access, constants, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { styleText } from "node:util";

import { build } from "vite";

import {
  defineGeneratorFactory,
  mergeConfigs,
  pathResolver,
  spinnerFactory,
  vitePlugins,
} from "@kosmojs/lib";

export default defineGeneratorFactory((sourceFolder) => {
  const {
    generators = [],
    refineTypeName,
    ...config
  } = { ...sourceFolder.config };

  const { createPath } = pathResolver(sourceFolder);

  return {
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

      // NOTE: copy assets before generating routes
      await cp(resolve(dir, "../client/assets"), join(dir, "assets"), {
        recursive: true,
      });

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
        const routes = await import(join(dir, "routes.js")).then(
          (e) => e.default,
        );

        createDisposableServer(async (port: number) => {
          for (const [i, route] of routes.entries()) {
            spinner.append(`[ ${i + 1} of ${routes.length} ] ${route}`);
            const html = await fetchRoute(port, route);
            if (html === undefined) {
              continue;
            }
            await mkdir(join(dir, route), { recursive: true });
            await writeFile(join(dir, join(route, "index.html")), html, "utf8");
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
