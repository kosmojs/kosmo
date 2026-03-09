import { RequestValidationTargets, type ValidationTarget } from "@kosmojs/api";
import {
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  renderHelpers,
  sortRoutes,
} from "@kosmojs/dev";

import fetchLibTpl from "./templates/@fetch/lib.ts?as=text";
import fetchTpl from "./templates/fetch.hbs";
import routeTpl from "./templates/route.hbs";
import unwrapTpl from "./templates/unwrap.hbs";

export const factory: GeneratorFactory = async ({ appRoot, sourceFolder }) => {
  const { createPath, createImportHelper } = pathResolver({
    appRoot,
    sourceFolder,
  });

  const { renderToFile } = renderFactory({
    helpers: {
      createImport: createImportHelper,
      createParamsLiteral: renderHelpers.createParamsLiteral,
    },
  });

  // supposed to be replaced by specialized generators, write it only at initialization.
  // fetch generator always runs before other generators
  // so it is safe to re-initialize this file before specialized generators update it.
  await renderToFile(createPath.lib("unwrap.ts"), unwrapTpl, {});

  const generateLibFiles = async (
    entries: Array<ResolvedEntry>,
    updatedEntries: Array<ResolvedEntry>,
  ) => {
    const routes = entries
      .flatMap(({ kind, entry }) => (kind === "apiRoute" ? [entry] : []))
      .sort(sortRoutes);

    for (const [file, template] of [
      ["fetch.ts", fetchTpl],
      ["@fetch/lib.ts", fetchLibTpl],
    ]) {
      await renderToFile(createPath.lib(file), template, {
        routes,
      });
    }

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

        await renderToFile(
          createPath.libApi(entry.name, "fetch.ts"),
          routeTpl,
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
};
