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

export const factory: GeneratorFactory = async ({
  appRoot,
  sourceFolder,
  formatters,
}) => {
  const { createPath, createImportHelper } = pathResolver({
    appRoot,
    sourceFolder,
  });

  const { renderToFile } = renderFactory({
    formatters,
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
        const routeMethods = entry.methods.map((method) => {
          const payloadType = entry.payloadTypes.find(
            (e) => e.method === method,
          );
          const responseType = entry.responseTypes.find(
            (e) => e.method === method,
          );
          return {
            method,
            payloadType,
            responseType,
          };
        });

        const paramsMapper = entry.params.schema.map(({ name }, idx) => ({
          name,
          idx,
        }));

        await renderToFile(createPath.fetch(entry.file), routeTpl, {
          route: entry,
          routeMethods,
          paramsMapper,
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
