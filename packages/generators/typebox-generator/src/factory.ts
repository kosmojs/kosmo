import { dirname, join } from "node:path";

import {
  defaults,
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  renderToFile,
  typeboxLiteralText,
} from "@kosmojs/devlib";

import errorHandlerTpl from "./error-handler.ts?as=text";
import type { Options } from "./types";

import libTpl from "./templates/lib.hbs";
import schemasTpl from "./templates/schemas.hbs";

export const factory: GeneratorFactory<Options> = async (
  pluginoptions,
  options,
) => {
  const { appRoot, sourceFolder, formatters } = pluginoptions;
  const { validationMessages = {}, importCustomTypes } = { ...options };

  const { resolve } = pathResolver({ appRoot, sourceFolder });

  for (const [file, template] of [
    ["index.ts", libTpl],
    ["error-handler.ts", errorHandlerTpl],
  ]) {
    await renderToFile(
      resolve("libDir", `{typebox}/${file}`),
      template,
      {
        validationMessages: JSON.stringify(validationMessages),
        importPathmap: {
          customTypes: importCustomTypes,
        },
      },
      { formatters },
    );
  }

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind !== "apiRoute") {
        continue;
      }

      await renderToFile(
        resolve("apiLibDir", dirname(entry.file), "schemas.ts"),
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
          importPathmap: {
            typebox: join(defaults.appPrefix, defaults.libDir, "{typebox}"),
          },
        },
        { formatters },
      );
    }
  };

  return {
    async watchHandler(entries, event) {
      if (event) {
        if (event.kind === "update") {
          await generateLibFiles(
            entries.filter(({ kind, entry }) => {
              return kind === "apiRoute"
                ? entry.fileFullpath === event.file ||
                    entry.referencedFiles?.includes(event.file)
                : false;
            }),
          );
        }
      } else {
        // no event means initial call
        await generateLibFiles(entries);
      }
    },
  };
};
