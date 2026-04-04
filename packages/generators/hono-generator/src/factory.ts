import { join } from "node:path";

import crc from "crc/crc32";
import picomatch, { type Matcher } from "picomatch";

import type { ApiRoute, ResolvedEntry } from "@kosmojs/core";
import {
  createHonoPattern,
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
      },
    });

    const { renderToFile: deploySrcFile } = renderFactory({
      helpers: createImportHelpers({ origin: "src" }),
    });

    const customTemplates: Array<[Matcher, string]> = Object.entries({
      ...options?.templates,
    }).map(([pattern, template]) => [picomatch(pattern), template]);

    // by default, write only to blank files
    const overwrite = (content: string) => content?.trim().length === 0;

    const generateSrcFiles = async (entries: Array<ResolvedEntry>) => {
      for (const { kind, entry } of entries) {
        if (kind === "apiRoute") {
          const customTemplate = customTemplates.find(([isMatch]) => {
            return isMatch(entry.name);
          });
          await deploySrcFile(
            createPath.api(entry.file),
            customTemplate?.[1] || templates.srcRouteIndex,
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

          const cascadingMiddleware = entries.flatMap((e) => {
            return e.kind === "apiUse"
              ? pathVariations.some((path) => e.entry.name === path)
                ? [e.entry]
                : []
              : [];
          });

          const baseRoute = {
            ...entry,
            path: entry.honoPattern,
            cascadingMiddleware,
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
                      fullpath: createHonoPattern(pathTokens),
                      pathTokens,
                    },
                  ]
                : [];
            },
          );

          return [baseRoute, ...aliases];
        })
        .sort(sortRoutes);

      const cascadingMiddleware = entries.flatMap(({ kind, entry }) => {
        return kind === "apiUse" ? [entry] : [];
      });

      for (const [file, template] of [
        //
        ["@api/routes.ts", templates.libApiRoutes],
      ]) {
        await deployLibFile(createPath.lib(file), template, {
          routes: routesWithAliases,
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
          ["@api/bodyparser.ts", templates.libApiBodyparser],
          ["@api/dev.ts", templates.libApiDev],
          ["@api/errors.ts", templates.libApiErrors],
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

      plugins() {
        return [];
      },
    };
  },
);
