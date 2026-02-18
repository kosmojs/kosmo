import type { ValidationTarget } from "@kosmojs/api";
import {
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  sortRoutes,
} from "@kosmojs/dev";

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

    await renderToFile(`${createPath.fetch()}.ts`, fetchTpl, { routes });

    for (const { kind, entry } of updatedEntries) {
      if (kind === "apiRoute") {
        let runtimeValidation = false;

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
              if (resolvedType) {
                runtimeValidation = true;
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
            if (resolvedType) {
              runtimeValidation = true;
            }
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

        const paramsMapper = entry.params.schema.map(
          ({ name, isOptional, isRest }, idx) => ({
            name,
            isOptional,
            isRest,
            idx,
          }),
        );

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

        await renderToFile(createPath.fetch(entry.file), routeTpl, {
          route: entry,
          validationTypes,
          routeMethods,
          paramsMapper,
          payloadTypes,
          responseTypes,
          runtimeValidation,
        });
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
