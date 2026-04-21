import { join } from "node:path";

import crc from "crc/crc32";

import type { ApiRoute, ResolvedEntry, RouteEntry } from "@kosmojs/core";
import {
  createPathPattern,
  createTemplateResolver,
  defineGeneratorFactory,
  pathResolver,
  pathTokensFactory,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import * as templates from "./templates";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImportHelpers } = pathResolver(sourceFolder);

    const cascadingState = (ids: Array<string>): string => {
      if (ids.length === 0) {
        return "{}";
      }
      if (ids.length === 1) {
        return ids[0];
      }
      return `Override<${ids[0]}, ${cascadingState(ids.slice(1))}>`;
    };

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        paramsDefaults({ params }: ApiRoute) {
          const elements = params.schema.map(() => "unknown?");
          return `[${elements.join(", ")}]`;
        },
        paramsMappings({ params }: ApiRoute) {
          const elements = params.schema.map(({ name, kind }) => {
            return `["${name}", unknown, ${kind === "required" ? "true" : "false"}]`;
          });
          return `[${elements.join(", ")}]`;
        },
        cascadingState({
          cascadingMiddleware,
        }: ApiRoute & {
          cascadingMiddleware: Array<RouteEntry>;
        }) {
          return cascadingState(
            cascadingMiddleware.map(({ id }) => `ExtendT${id}`),
          );
        },
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    // by default, write only to blank files
    const overwrite = (content: string) => content?.trim().length === 0;

    const templateResolver = createTemplateResolver(
      options?.templates,
      templates.srcRouteIndex,
    );

    const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
      for (const { kind, entry } of entries) {
        if (kind === "apiRoute") {
          await deploySrcFile(
            createPath.api(entry.file),
            templateResolver(entry.name, entry),
            { route: entry },
            { overwrite },
          );
        } else if (kind === "apiUse") {
          await deploySrcFile(
            createPath.api(entry.file),
            templates.srcRouteUse,
            {},
            { overwrite },
          );
        }
      }
    };

    const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
      const cascadingMiddleware = entries.flatMap(({ kind, entry }) => {
        return kind === "apiUse" ? [entry] : [];
      });

      const routesAndAliases = entries
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

          const baseRoute = {
            ...entry,
            path: entry.pathPattern,
            cascadingMiddleware: cascadingMiddleware.flatMap((e) => {
              return pathVariations.some((path) => e.name === path) ? [e] : [];
            }),
          };

          const aliases: Array<
            ApiRoute & {
              fullpath: string;
            }
          > = Object.entries({ ...options?.alias }).flatMap(
            ([url, routeName]) => {
              const pathTokens = pathTokensFactory(url);
              return routeName === entry.name
                ? [
                    {
                      ...baseRoute,
                      name: url,
                      id: `${baseRoute.id}_${crc(url)}`,
                      fullpath: createPathPattern(pathTokens),
                      pathTokens,
                    },
                  ]
                : [];
            },
          );

          return [baseRoute, ...aliases];
        })
        .sort(sortRoutes);

      for (const [file, template] of [
        ["@api/routes.ts", templates.libApiRoutes],
      ]) {
        await deployLibFile(createPath.lib(file), template, {
          routes: routesAndAliases,
          cascadingMiddleware,
        });
      }
    };

    return {
      meta,
      options,

      async start() {
        // deploy global lib files that does not change on routes updates
        for (const [file, template] of [
          ["api.ts", templates.libApi],
          ["api:factory.ts", templates.libApiFactory],
          ["@api/app.ts", templates.libApiApp],
          ["@api/dev.ts", templates.libApiDev],
          ["@api/errors.ts", templates.libApiErrors],
          ["@api/bodyparser.ts", templates.libApiBodyparser],
          ["@api/router.ts", templates.libApiRouter],
          ["@api/server.ts", templates.libApiServer],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change on routes updates
        for (const [file, template] of [
          ["env.d.ts", templates.srcEnv],
          ["app.ts", templates.srcApp],
          ["dev.ts", templates.srcDev],
          ["errors.ts", templates.srcErrors],
          ["router.ts", templates.srcRouter],
          ["server.ts", templates.srcServer],
          ["use.ts", templates.srcUse],
        ]) {
          await deploySrcFile(
            createPath.api(file),
            template,
            {},
            { overwrite },
          );
        }
      },

      async watch(entries, event) {
        // fill empty src files with proper content.
        // handle 2 cases:
        // - event is undefined (means initial call): process all routes
        // - `create` event given: process newly added route
        if (!event || event.kind === "create") {
          // always generateSrcFiles before generateLibFiles
          await generateSrcFiles(entries);
        }

        await generateLibFiles(entries);

        // TODO: handle `delete` event, cleanup lib files
      },

      async build(entries) {
        await generateSrcFiles(entries);
        await generateLibFiles(entries);
      },
    };
  },
);
