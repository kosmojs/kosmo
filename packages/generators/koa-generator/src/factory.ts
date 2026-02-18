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
  renderFactory,
  sortRoutes,
} from "@kosmojs/dev";

import type { Options } from "./types";

import libApiAppTpl from "./templates/lib/api:app.ts?as=text";
import libApiBodyparserTpl from "./templates/lib/api:bodyparser.ts?as=text";
import libApiDevTpl from "./templates/lib/api:dev.ts?as=text";
import libApiRouteTpl from "./templates/lib/api:route.ts?as=text";
import libApiRouterTpl from "./templates/lib/api:router.ts?as=text";
import libApiRoutesTpl from "./templates/lib/api:routes.hbs";
import libApiServerTpl from "./templates/lib/api:server.ts?as=text";
import libApiTpl from "./templates/lib/api.ts?as=text";
import libRouteTpl from "./templates/lib/route.hbs";
import srcAppTpl from "./templates/src/app.ts?as=text";
import srcDevTpl from "./templates/src/dev.ts?as=text";
import srcEnvTpl from "./templates/src/env.hbs";
import srcRouteIndexTpl from "./templates/src/route/index.hbs";
import srcRouteUseTpl from "./templates/src/route/use.hbs";
import srcRouterTpl from "./templates/src/router.ts?as=text";
import srcServerTpl from "./templates/src/server.ts?as=text";
import srcUseTpl from "./templates/src/use.ts?as=text";

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, outDir },
  { alias, templates, meta },
) => {
  const { createPath, createImportHelper } = pathResolver({
    appRoot,
    sourceFolder,
  });

  const { renderToFile } = renderFactory({
    helpers: {
      createImport: createImportHelper,
    },
    partials: {
      libApiTpl,
    },
  });

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

  // by default, write only to blank files
  const overwrite = (content: string) => content?.trim().length === 0;

  for (const [file, template] of [
    ["env.d.ts", srcEnvTpl],
    ["app.ts", srcAppTpl],
    ["dev.ts", srcDevTpl],
    ["router.ts", srcRouterTpl],
    ["server.ts", srcServerTpl],
    ["use.ts", srcUseTpl],
  ]) {
    await renderToFile(createPath.api(file), template, {}, { overwrite });
  }

  const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind === "apiRoute") {
        const customTemplate = customTemplates.find(([isMatch]) => {
          return isMatch(entry.name);
        });
        await renderToFile(
          createPath.api(entry.file),
          customTemplate?.[1] || srcRouteIndexTpl,
          { route: entry },
          { overwrite },
        );
      } else if (kind === "apiUse") {
        await renderToFile(
          createPath.api(entry.file),
          srcRouteUseTpl,
          {
            funcName: [
              "use",
              entry.name
                .replace(/\[|\]/g, "")
                .replace(/\W+(\w)/g, (...a) => String(a[1]).toUpperCase())
                .replace(/^(\w)/, (m) => m.toUpperCase()),
            ].join(""),
          },
          { overwrite },
        );
      }
    }
  };

  const generateLibFiles = async (
    entries: Array<ResolvedEntry>,
    updatedEntries: Array<ResolvedEntry>,
  ) => {
    const routesWithAliases = entries
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
        };

        const aliases = Object.entries(alias || {}).flatMap(
          ([url, routeName]) => {
            const pathTokens = pathTokensFactory(url);
            return routeName === entry.name
              ? [
                  {
                    ...baseRoute,
                    name: url,
                    id: `${baseRoute.id}_${crc(url)}`,
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
      return kind === "apiUse" ? [entry] : [];
    });

    for (const [file, template] of [
      [createPath.lib("api.ts"), libApiTpl],
      [createPath.lib("api:app.ts"), libApiAppTpl],
      [createPath.lib("api:bodyparser.ts"), libApiBodyparserTpl],
      [createPath.lib("api:dev.ts"), libApiDevTpl],
      [createPath.lib("api:route.ts"), libApiRouteTpl],
      [createPath.lib("api:routes.ts"), libApiRoutesTpl],
      [createPath.lib("api:router.ts"), libApiRouterTpl],
      [createPath.lib("api:server.ts"), libApiServerTpl],
    ]) {
      await renderToFile(file, template, {
        routes: routesWithAliases,
        useWrappers,
      });
    }

    for (const { kind, entry } of updatedEntries) {
      if (kind === "apiRoute") {
        await renderToFile(
          createPath.libApi(dirname(entry.file), "index.ts"),
          libRouteTpl,
          {
            route: entry,
            params: entry.params.schema,
          },
        );
      }
    }
  };

  return {
    async watch(entries, event) {
      // fill empty src files with proper content.
      // handle 2 cases:
      // - event is undefined (means initial call): process all routes
      // - `create` event given: process newly added route
      if (!event || event.kind === "create") {
        // always generateSrcFiles before generateLibFiles
        await generateSrcFiles(entries);
      }

      await generateLibFiles(
        entries,
        // create/overwrite lib files with proper content.
        // handle 2 cases:
        // - event is undefined (means initial call): process all routes
        // - `update` event given: process updated route
        event
          ? entries.filter(({ kind, entry }) => {
              return event.kind === "update"
                ? kind === "apiRoute"
                  ? entry.fileFullpath === event.file
                  : false
                : false;
            })
          : entries,
      );

      // TODO: handle `delete` event, cleanup lib files
    },

    async build(entries) {
      // always generateSrcFiles before generateLibFiles
      await generateSrcFiles(entries);
      await generateLibFiles(entries, entries);

      const esbuildOptions: BuildOptions = await import(
        join(appRoot, "esbuild.json"),
        { with: { type: "json" } }
      ).then((e) => e.default);

      // run esbuild only after all files generated
      await esbuild({
        ...esbuildOptions,
        bundle: true,
        entryPoints: [
          // Build both app factory and server bundle for deployment flexibility.
          // The app exports a function returning a Koa instance (Node/Deno/Bun compatible).
          // For custom deployment, use the app factory directly and discard the built server.
          createPath.api("app.ts"),
          createPath.api("server.ts"),
        ],
        outdir: join(outDir, defaults.apiDir),
      });
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
      return path === "/" ? [] : [path.replace(/:/g, "\\\\:")];
    })
    .join("/")
    .replace(/\/\{/g, "{")
    .replace(/\+/g, "\\\\+");
};
