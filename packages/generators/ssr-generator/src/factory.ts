import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { type BuildOptions, build as esbuild } from "esbuild";
import { build, loadConfigFromFile, type Plugin } from "vite";

import {
  defaults,
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  type RouteEntry,
  renderToFile,
  sortRoutes,
} from "@kosmojs/devlib";

import serverTpl from "./templates/server.hbs";

export const factory: GeneratorFactory = async ({
  appRoot,
  sourceFolder,
  outDir,
  command,
}) => {
  const pathToRegexp = await readFile(
    resolve(import.meta.dirname, "path-to-regexp.js"),
    "utf8",
  );

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { resolve } = pathResolver({ appRoot, sourceFolder });

    const routes = entries.flatMap(({ kind, entry }) => {
      return kind === "pageRoute" ? [entry] : [];
    });

    const layouts = entries.flatMap(({ kind, entry }) => {
      return kind === "pageLayout" ? [entry] : [];
    });

    const viteConfig = await loadConfigFromFile(
      { command: "build", mode: "ssr" },
      resolve("@", "vite.config.ts"),
    );

    const esbuildOptions: BuildOptions = await import(
      join(appRoot, "esbuild.json"),
      { with: { type: "json" } }
    ).then((e) => e.default);

    const { plugins, ...config } = { ...viteConfig?.config };

    // build the SSR bundle using `entry/server.ts` as the entry point.
    // NOTE: this file is deployed by userland generators,
    // therefore the SSR generator must run last to ensure this file exists.
    await build({
      configFile: false,
      ...config,
      // WARN: excluding basePlugin is essential to avoid an infinite build loop.
      plugins: plugins
        ? plugins.filter((e) => (e as Plugin)?.name !== "@kosmojs:basePlugin")
        : [],
      build: {
        ssr: resolve("entryDir", "server.ts"),
        ssrEmitAssets: false,
        outDir: join(outDir, "ssr"),
        emptyOutDir: true,
        sourcemap: true,
        // TODO: review this option when Vite switched to Rolldown
        rollupOptions: {
          output: {
            entryFileNames: "app.js",
          },
        },
      },
    });

    const ssrLibFile = resolve("libDir", sourceFolder, "{ssr}.ts");

    await writeFile(
      resolve("libDir", sourceFolder, "path-to-regexp.ts"),
      pathToRegexp,
      "utf8",
    );

    const routeMap: Array<{
      path: string;
      file: string;
      layouts: Array<string>;
    }> = [...routes].sort(sortRoutes).map((route) => {
      return {
        path: generatePathPattern(route),
        file: join(defaults.pagesDir, route.file),
        layouts: layouts.flatMap(({ name, file }) => {
          return name === route.name || route.file.startsWith(`${name}/`)
            ? [join(defaults.pagesDir, file)]
            : [];
        }),
      };
    }, {});

    await renderToFile(ssrLibFile, serverTpl, {
      routeMap: routeMap,
      importPathmap: {
        config: join(sourceFolder, "config"),
      },
    });

    // Build default server for SSR. It is using node:http server.
    // For custom deployment, use the app factory directly and discard the built server.
    await esbuild({
      ...esbuildOptions,
      bundle: true,
      legalComments: "inline",
      entryPoints: [ssrLibFile],
      outfile: join(outDir, "ssr", "server.js"),
    });
  };

  return {
    async watchHandler(entries, event) {
      if (event || command !== "build") {
        return;
      }
      await generateLibFiles(entries);
    },
  };
};

export const generatePathPattern = ({ pathTokens }: RouteEntry): string => {
  return pathTokens
    .map(({ param, path }) => {
      if (param?.isRest) {
        return [`{/*${param.name}}`];
      }
      if (param?.isOptional) {
        return [`{/:${param.name}}`];
      }
      if (param) {
        return [`:${param.name}`];
      }
      return path === "/" ? [] : path;
    })
    .join("/")
    .replace(/\/\{/g, "{")
    .replace(/\+/g, "\\\\+");
};
