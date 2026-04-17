import {
  RequestValidationTargets,
  type ResolvedEntry,
  type ValidationTarget,
} from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  sortRoutes,
} from "@kosmojs/lib";

import * as templates from "./templates";

export default defineGeneratorFactory((meta, sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const { renderToFile: deployLibFile } = renderFactory({
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
          resolvedType: unknown;
        }> = [];

        for (const def of entry.validationDefinitions) {
          if (def.target === "response") {
            for (const { id, body, resolvedType } of def.variants) {
              if (body) {
                validationTypes.push({
                  id,
                  target: def.target,
                  method: def.method,
                  resolvedType,
                });
              }
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

        const routeMethods = entry.methods.map((method) => {
          return {
            method,
            responseType: validationTypes.find((e) => {
              return e.target === "response" ? e.method === method : false;
            }),
          };
        });

        const payloadTypes = Object.entries(
          validationTypes.reduce<
            Record<string, Array<(typeof validationTypes)[number]>>
          >((map, { id, target, method, resolvedType }) => {
            if (target !== "response") {
              const key = `${target.replace(/^./, (c) => c.toUpperCase())}T`;
              if (!map[key]) {
                map[key] = [];
              }
              map[key].push({ id, target, method, resolvedType });
            }
            return map;
          }, {}),
        ).map(([name, types]) => {
          return { name, types, target: types[0].target };
        });

        const payloadTargets = Object.keys(RequestValidationTargets).map(
          (target) => {
            const payloadType = payloadTypes.find((e) => e.target === target);
            return {
              target,
              payloadType,
            };
          },
        );

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
            payloadTypes,
            payloadTargets,
            responseTypes,
          },
        );
      }
    }
  };

  return {
    meta,

    async start() {
      // supposed to be replaced by specialized generators, write it only at initialization.
      // fetch generator always runs before other generators
      // so it is safe to re-initialize this file before specialized generators update it.
      await deployLibFile(createPath.lib("unwrap.ts"), templates.unwrap, {});
    },

    async watch(entries, event) {
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
      await generateLibFiles(entries, entries);
    },
  };
});
