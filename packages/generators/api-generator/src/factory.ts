import { dirname, join } from "node:path";

import crc from "crc/crc32";
import { type BuildOptions, build as esbuild } from "esbuild";
import picomatch, { type Matcher } from "picomatch";

import {
  type ApiRoute,
  defaults,
  type GeneratorFactory,
  type PathToken,
  pathResolver,
  pathTokensFactory,
  type ResolvedEntry,
  renderToFile,
  sortRoutes,
} from "@kosmojs/devlib";

import type { Options } from "./types";

import indexTpl from "./templates/index.hbs";
import routeLibIndexTpl from "./templates/route/index.hbs";
import routeTpl from "./templates/route.hbs";
import useTpl from "./templates/use.hbs";

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, outDir, formatters, command },
  { alias, templates, meta },
) => {
  const { resolve } = pathResolver({ appRoot, sourceFolder });

  const customTemplates: Array<[Matcher, string]> = Object.entries(
    templates || {},
  ).map(([pattern, template]) => [picomatch(pattern), template]);

  const metaMatchers: Array<[Matcher, unknown]> = Object.entries(
    meta || {},
  ).map(([pattern, meta]) => [picomatch(pattern), meta]);

  const resolveMeta = ({ name }: ApiRoute) => {
    const match = metaMatchers.find(([isMatch]) => isMatch(name));
    return Object.prototype.toString.call(match?.[1]) === "[object Object]"
      ? JSON.stringify(match?.[1])
      : undefined;
  };

  const generatePublicFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind === "apiRoute") {
        const customTemplate = customTemplates.find(([isMatch]) => {
          return isMatch(entry.name);
        });

        await renderToFile(
          resolve("apiDir", entry.file),
          customTemplate?.[1] || routeTpl,
          {
            route: entry,
            importPathmap: {
              lib: join(sourceFolder, defaults.apiLibDir, entry.importFile),
            },
          },
          {
            // write only to blank files
            overwrite: (content) => content?.trim().length === 0,
            formatters,
          },
        );
      } else if (kind === "apiUse") {
        await renderToFile(
          resolve("apiDir", entry.file),
          useTpl,
          {},
          {
            // write only to blank files
            overwrite: (content) => content?.trim().length === 0,
            formatters,
          },
        );
      }
    }
  };

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind !== "apiRoute") {
        continue;
      }

      const context = {
        route: entry,
        params: entry.params.schema,
      };

      for (const [file, template] of [
        //
        ["index.ts", routeLibIndexTpl],
      ]) {
        await renderToFile(
          resolve("apiLibDir", dirname(entry.file), file),
          template,
          context,
          { formatters },
        );
      }
    }
  };

  const generateIndexFiles = async (entries: Array<ResolvedEntry>) => {
    const routes = entries
      .flatMap(({ kind, entry }) => {
        if (kind !== "apiRoute") {
          return [];
        }

        const pathVariations = entry.name
          .split("/")
          .reduce<Array<string>>((acc, segment) => {
            const prev = acc[acc.length - 1];
            acc.push(prev ? join(prev, segment) : segment);
            return acc;
          }, []);

        const useWrappers = entries.flatMap((e) => {
          return e.kind === "apiUse"
            ? pathVariations.some((path) => e.entry.name === path)
              ? [e.entry]
              : []
            : [];
        });

        const baseRoute = {
          ...entry,
          path: pathFactory(entry.pathTokens),
          meta: resolveMeta(entry),
          useWrappers,
          importPathmap: {
            api: join(sourceFolder, defaults.apiDir, entry.importFile),
            schemas: join(
              sourceFolder,
              defaults.apiLibDir,
              dirname(entry.file),
              "schemas",
            ),
          },
        };

        const aliases = Object.entries(alias || {}).flatMap(
          ([url, routeName]) => {
            const pathTokens = pathTokensFactory(url);
            return routeName === entry.name
              ? [
                  {
                    ...baseRoute,
                    name: url,
                    importName: `${baseRoute.importName}_${crc(url)}`,
                    fullpath: pathFactory(pathTokens),
                    pathTokens,
                  },
                ]
              : [];
          },
        );

        return [baseRoute, ...aliases];
      })
      .sort(sortRoutes);

    const useWrappers = entries.flatMap(({ kind, entry }) => {
      return kind === "apiUse"
        ? [
            {
              ...entry,
              importPath: join(sourceFolder, defaults.apiDir, entry.importFile),
            },
          ]
        : [];
    });

    await renderToFile(
      resolve("libDir", sourceFolder, `${defaults.apiLibDir}.ts`),
      indexTpl,
      {
        routes,
        useWrappers,
        importPathmap: {
          config: join(sourceFolder, defaults.configDir),
          coreMiddleware: join(sourceFolder, defaults.apiDir, "use"),
        },
      },
      { formatters },
    );
  };

  if (command === "build") {
    const esbuildOptions: BuildOptions = await import(
      join(appRoot, "esbuild.json"),
      { with: { type: "json" } }
    ).then((e) => e.default);
    await esbuild({
      ...esbuildOptions,
      bundle: true,
      entryPoints: [
        // Build both app factory and server bundle for deployment flexibility.
        // The app exports a function returning a Koa instance (Node/Deno/Bun compatible).
        // For custom deployment, use the app factory directly and discard the built server.
        resolve("apiDir", "app.ts"),
        resolve("apiDir", "server.ts"),
      ],
      outdir: join(outDir, defaults.apiDir),
    });
  }

  return {
    async watchHandler(entries, event) {
      if (event) {
        const relatedEntries = entries.filter(({ kind, entry }) => {
          return kind === "apiRoute" || kind === "apiUse" //
            ? entry.fileFullpath === event.file
            : false;
        });
        if (event.kind === "create") {
          await generatePublicFiles(relatedEntries);
          await generateLibFiles(relatedEntries);
        } else if (event.kind === "update") {
          await generateLibFiles(relatedEntries);
        }
      } else {
        // no event means initial call
        await generatePublicFiles(entries);
        await generateLibFiles(entries);
      }

      await generateIndexFiles(entries);
    },
  };
};

export const pathFactory = (pathTokens: Array<PathToken>) => {
  return pathTokens
    .flatMap(({ path, param }) => {
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
