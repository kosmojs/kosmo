import { join } from "node:path";

import crc from "crc/crc32";
import { parse, type Token } from "path-to-regexp";
import picomatch, { type Matcher } from "picomatch";

import {
  type ApiRoute,
  defineGeneratorFactory,
  normalizeStaticValue,
  type PathToken,
  type PathTokenParamPart,
  type PathTokenStaticPart,
  pathResolver,
  pathTokensFactory,
  type ResolvedEntry,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import type { Options } from "./types";

import libApiAppTpl from "./templates/lib/@api/app.ts?as=text";
import libApiBodyparserTpl from "./templates/lib/@api/bodyparser.ts?as=text";
import libApiDevTpl from "./templates/lib/@api/dev.ts?as=text";
import libApiErrorsTpl from "./templates/lib/@api/errors.ts?as=text";
import libApiRouterTpl from "./templates/lib/@api/router.ts?as=text";
import libApiRoutesTpl from "./templates/lib/@api/routes.hbs";
import libApiServerTpl from "./templates/lib/@api/server.ts?as=text";
import libApiFactoryTpl from "./templates/lib/api:factory.ts?as=text";
import libApiTpl from "./templates/lib/api.ts?as=text";
import srcAppTpl from "./templates/src/app.ts?as=text";
import srcDevTpl from "./templates/src/dev.ts?as=text";
import srcEnvTpl from "./templates/src/env.d.ts?as=text";
import srcErrorsTpl from "./templates/src/errors.ts?as=text";
import srcRouteIndexTpl from "./templates/src/route/index.ts?as=text";
import srcRouteUseTpl from "./templates/src/route/use.ts?as=text";
import srcRouterTpl from "./templates/src/router.ts?as=text";
import srcServerTpl from "./templates/src/server.ts?as=text";
import srcUseTpl from "./templates/src/use.ts?as=text";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { alias, templates } = { ...options };
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

    const customTemplates: Array<[Matcher, string]> = Object.entries(
      templates || {},
    ).map(([pattern, template]) => [picomatch(pattern), template]);

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
            customTemplate?.[1] || srcRouteIndexTpl,
            { route: entry },
            { overwrite },
          );
        } else if (kind === "apiUse") {
          await deploySrcFile(
            createPath.api(entry.file),
            srcRouteUseTpl,
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
            path: pathFactory(entry.pathTokens),
            cascadingMiddleware,
          };

          const aliases: Array<
            ApiRoute & {
              fullpath: string;
            }
          > = Object.entries({ ...alias }).flatMap(([url, routeName]) => {
            const [pathTokens, fullpath] = pathTokensFactory(url);
            return routeName === entry.name
              ? [
                  {
                    ...baseRoute,
                    name: url,
                    id: `${baseRoute.id}_${crc(url)}`,
                    fullpath,
                    pathTokens,
                  },
                ]
              : [];
          });

          return [baseRoute, ...aliases];
        })
        .sort(sortRoutes);

      const cascadingMiddleware = entries.flatMap(({ kind, entry }) => {
        return kind === "apiUse" ? [entry] : [];
      });

      for (const [file, template] of [
        //
        ["@api/routes.ts", libApiRoutesTpl],
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
          ["api.ts", libApiTpl],
          ["api:factory.ts", libApiFactoryTpl],
          ["@api/app.ts", libApiAppTpl],
          ["@api/bodyparser.ts", libApiBodyparserTpl],
          ["@api/dev.ts", libApiDevTpl],
          ["@api/errors.ts", libApiErrorsTpl],
          ["@api/router.ts", libApiRouterTpl],
          ["@api/server.ts", libApiServerTpl],
        ]) {
          await deployLibFile(createPath.lib(file), template, {});
        }

        // deploy global src files that does not change on routes updates
        for (const [file, template] of [
          ["env.d.ts", srcEnvTpl],
          ["app.ts", srcAppTpl],
          ["dev.ts", srcDevTpl],
          ["errors.ts", srcErrorsTpl],
          ["router.ts", srcRouterTpl],
          ["server.ts", srcServerTpl],
          ["use.ts", srcUseTpl],
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

const pathFactory = (pathTokens: Array<PathToken>) => {
  const staticValue = ({ value }: PathTokenStaticPart) => {
    return normalizeStaticValue(value);
  };

  const paramValue = (p: PathTokenParamPart) => {
    if (p.kind === "splat") {
      return `*`;
    }
    if (p.kind === "optional") {
      return `:${p.name}?`;
    }
    return `:${p.name}`;
  };

  return pathTokens
    .flatMap((token, i) => {
      if (token.kind === "static") {
        return [staticValue(token.parts[0] as PathTokenStaticPart)];
      }

      if (token.kind === "param") {
        return [paramValue(token.parts[0] as PathTokenParamPart)];
      }

      // mixed → parse pattern, build regex, emit disposable param
      const { tokens } = parse(token.pattern.replace(/\//g, ""));

      const regex = tokensToRegex(tokens);

      return [`:_${i}{${regex}}`];
    })
    .join("/");
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokensToRegex = (tokens: Array<Token>): string => {
  return tokens
    .flatMap((t) => {
      if (t.type === "text") {
        return t.value === "/" ? [] : [escapeRegex(t.value)];
      }
      if (t.type === "wildcard") {
        return [".+"];
      }
      if (t.type === "param") {
        return ["[^/]+"];
      }
      if (t.type === "group") {
        return [`(?:${tokensToRegex(t.tokens)})?`];
      }
      return [];
    })
    .join("");
};
