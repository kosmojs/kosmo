import type {
  ResolvedEntry,
  ResolvedTypeSignature,
  ValidationTarget,
} from "@kosmojs/core";
import { HTTPMethods } from "@kosmojs/core/fetch";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  createWatchedApiRouteEntriesFilter,
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import * as templates from "./templates";

export default defineGeneratorFactory((sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const { render: renderLibTpl, renderToFile: deployLibFile } = renderFactory({
    helpers: {
      ...createImportHelpers({ origin: "lib" }),
      ...routeRenderHelpers(),
    },
  });

  const generateLibFiles = async (
    entries: Array<ResolvedEntry>,
    updatedEntries: Array<ResolvedEntry>,
  ) => {
    const routes = entries
      .flatMap(({ kind, entry }) => (kind === "apiRoute" ? [entry] : []))
      .sort(sortRoutes);

    await deployLibFile(createPath.lib("fetch.ts"), templates.fetch, {
      routes,
    });

    for (const { kind, entry } of updatedEntries) {
      if (kind === "apiRoute") {
        const validationTypes: Array<{
          id: string;
          target: ValidationTarget;
          method: string;
          resolvedType: ResolvedTypeSignature | undefined;
        }> = [];

        for (const def of entry.validationDefinitions) {
          if (def.target === "response") {
            for (const { id, status, body, resolvedType } of def.variants) {
              if (!body || Math.floor(status / 100) !== 2) {
                // only consider 2xx body types.
                // providing non-2xx types to fetch clients is meaningless/confusing.
                continue;
              }
              validationTypes.push({
                id,
                target: def.target,
                method: def.method,
                resolvedType,
              });
            }
          } else {
            const { id, resolvedType } = def.schema;
            validationTypes.push({
              id,
              target: def.target,
              method: def.method,
              resolvedType,
            });
          }
        }

        const supportedMethods = Object.keys(HTTPMethods);

        const routeMethods = entry.methods.flatMap((method) => {
          if (!supportedMethods.includes(method)) {
            return [];
          }
          const payloadTypes = validationTypes.filter((e) => {
            return e.method === method
              ? ![
                  // skip these targets, validated on server only
                  "headers",
                  "cookies",
                  "response",
                ].includes(e.target)
              : false;
          });
          return [
            {
              method,
              payloadTypes,
              responseType: validationTypes.find((e) => {
                return e.target === "response" ? e.method === method : false;
              }),
            },
          ];
        });

        const responseTypes = Object.values(
          validationTypes.reduce<
            Record<
              string,
              { method: string; types: Array<(typeof validationTypes)[number]> }
            >
          >((map, { id, target, method, resolvedType }) => {
            if (target === "response") {
              if (!map[method]) {
                map[method] = { method, types: [] };
              }
              map[method].types.push({ id, target, method, resolvedType });
            }
            return map;
          }, {}),
        );

        await deployLibFile(
          createPath.libApi(entry.name, "fetch.ts"),
          templates.route,
          {
            route: entry,
            validationTypes,
            routeMethods,
            responseTypes,
          },
        );
      }
    }
  };

  return {
    async start() {
      for (const [file, template] of [
        // unwrap file supposed to be replaced by specialized generators, write it only at initialization.
        // fetch generator always runs before other generators
        // so it is safe to re-initialize this file before specialized generators update it.
        ["unwrap.ts", templates.unwrap],
      ]) {
        await deployLibFile(createPath.lib(file), template, {});
      }
    },

    async watch(entries, event) {
      await generateLibFiles(
        entries,
        // create/overwrite lib files with proper content.
        entries.filter(
          createWatchedApiRouteEntriesFilter(event, ["create", "update"]),
        ),
      );

      // TODO: handle `delete` event, cleanup lib files
    },

    async build(entries) {
      await generateLibFiles(entries, entries);
    },

    virtualModules() {
      return [
        {
          // The transport must differ between the browser and the SSR bundle
          specifier: "virtual:kosmo/fetch-transport",
          // `undefined` on the client, so fetch clients fall back to global fetch
          csr: `export const transport = undefined;`,
          // an in-process dispatch into the api app on the server
          ssr: renderLibTpl(templates.ssr, {}),
        },
      ];
    },
  };
});
