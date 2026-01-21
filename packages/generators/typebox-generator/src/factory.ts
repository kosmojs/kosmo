import {
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  renderFactory,
  typeboxLiteralText,
} from "@kosmojs/dev";

import errorHandlerTpl from "./error-handler.ts?as=text";
import type { Options } from "./types";

import indexTpl from "./templates/index.hbs";
import schemasTpl from "./templates/schemas.hbs";

export const factory: GeneratorFactory<Options> = async (
  pluginoptions,
  options,
) => {
  const { appRoot, sourceFolder, formatters } = pluginoptions;
  const { validationMessages = {}, importCustomTypes } = { ...options };

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

  for (const [file, template] of [
    ["index.ts", indexTpl],
    ["error-handler.ts", errorHandlerTpl],
  ]) {
    await renderToFile(createPath.lib("@typebox", file), template, {
      validationMessages: JSON.stringify(validationMessages),
      importCustomTypes,
    });
  }

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind !== "apiRoute") {
        continue;
      }

      await renderToFile(
        createPath.libApi(entry.name, "schemas.ts"),
        schemasTpl,
        {
          route: entry,
          routeMethods: entry.methods.map((method) => {
            return {
              method,
              payloadType: entry.payloadTypes.find((e) => e.method === method),
              responseType: entry.responseTypes.find(
                (e) => e.method === method,
              ),
            };
          }),
          resolvedTypes: [
            entry.params.resolvedType,
            ...entry.payloadTypes.flatMap((e) =>
              e.resolvedType ? [e.resolvedType] : [],
            ),
            ...entry.responseTypes.flatMap((e) =>
              e.resolvedType ? [e.resolvedType] : [],
            ),
          ].flatMap((resolvedType) => {
            return resolvedType
              ? [
                  {
                    ...resolvedType,
                    text: typeboxLiteralText(resolvedType.text, pluginoptions),
                  },
                ]
              : [];
          }),
        },
      );
    }
  };

  return {
    async watch(entries, event) {
      await generateLibFiles(
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
      await generateLibFiles(entries);
    },
  };
};
