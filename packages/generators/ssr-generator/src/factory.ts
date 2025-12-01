import { join } from "node:path";

import { type BuildOptions, build as esbuild } from "esbuild";
import { build, loadConfigFromFile, type Plugin } from "vite";

import {
  defaults,
  type GeneratorFactory,
  type PageRoute,
  type PathToken,
  pathResolver,
  renderToFile,
} from "@kosmojs/devlib";

import serverTpl from "./templates/server.hbs";

export const factory: GeneratorFactory = async ({
  appRoot,
  sourceFolder,
  outDir,
  command,
}) => {
  const generateLibFiles = async (routes: Array<PageRoute>) => {
    const { resolve } = pathResolver({ appRoot, sourceFolder });

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

    const ssrLisbFile = resolve("libDir", sourceFolder, "{ssr}.ts");

    await renderToFile(ssrLisbFile, serverTpl, {
      routes: routes.map((route) => {
        return {
          ...route,
          pathVariations: JSON.stringify(generatePathVariations(route)),
          manifestPathVariations: JSON.stringify(
            generateManifestPathVariations(route),
          ),
        };
      }),
      importPathmap: {
        config: join(sourceFolder, "config"),
      },
    });

    await esbuild({
      ...esbuildOptions,
      bundle: true,
      legalComments: "inline",
      entryPoints: [ssrLisbFile],
      outfile: join(outDir, "ssr", "index.js"),
    });
  };

  return {
    async watchHandler(entries, event) {
      if (event || command !== "build") {
        return;
      }
      await generateLibFiles(
        entries.flatMap(({ kind, entry }) => {
          return kind === "pageRoute" ? [entry] : [];
        }),
      );
    },
  };
};

const generatePathPattern = (tokens: PathToken[]): string => {
  return tokens
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

/**
 * Path Variation Generator
 *   variations for a/b/c:
 *   [ a/b/c ]
 *   variations for a/b/[c]:
 *   [ a/b/:c ]
 *   variations for a/b/[[c]]:
 *   [ a/b/{/:c}, a/b ]
 *   variations for a/[b]/[[c]]:
 *   [ a/:b/{/:c}, a/:b ]
 *   variations for a/[[b]]/[[c]]:
 *   [ a/{/:b}/{/:c}, a/{/:b}, a ]
 * */
export const generatePathVariations = ({
  pathTokens,
}: Pick<PageRoute, "pathTokens">) => {
  return pathTokens.flatMap((e, i) => {
    const next = pathTokens[i + 1];
    return !next || next.param?.isOptional || next.param?.isRest
      ? [generatePathPattern([...pathTokens.slice(0, i), e])]
      : [];
  });
};

export const generateManifestPathVariations = ({
  pathTokens,
}: Pick<PageRoute, "pathTokens">) => {
  return pathTokens.flatMap((e, i) => {
    const next = pathTokens[i + 1];
    return !next || next.param?.isOptional || next.param?.isRest
      ? [
          join(
            defaults.pagesDir,
            ...[...pathTokens.slice(0, i), e].map((e) => e.orig),
          ),
        ]
      : [];
  });
};
