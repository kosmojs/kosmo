import {
  type RequestValidationTarget,
  RequestValidationTargets,
  type ValidationTarget,
} from "@kosmojs/api";
import {
  type GeneratorFactory,
  pathResolver,
  type RequestValidationDefinition,
  type ResolvedEntry,
  type ResponseValidationDefinition,
  renderFactory,
  typeboxLiteralText,
} from "@kosmojs/dev";

import type { Options } from "./types";

import customTypesTpl from "./templates/custom-types.ts?as=text";
import errorHandlerTpl from "./templates/error-handler.ts?as=text";
import indexTpl from "./templates/index.ts?as=text";
import schemasTpl from "./templates/schemas.hbs";
import setupTpl from "./templates/setup.hbs";

const defaultSettings: Options["settings"] = {
  exactOptionalPropertyTypes: true,
};

export const factory: GeneratorFactory<Options> = async (
  pluginoptions,
  options,
) => {
  const { appRoot, sourceFolder } = pluginoptions;

  const { createPath, createImport, createImportHelper } = pathResolver({
    appRoot,
    sourceFolder,
  });

  const {
    validationMessages = {},
    customTypesImport = createImport.lib("@typebox/custom-types"),
    settings,
  } = { ...options };

  const { renderToFile } = renderFactory({
    helpers: {
      createImport: createImportHelper,
    },
  });

  for (const [file, template] of [
    ["index.ts", indexTpl],
    ["setup.ts", setupTpl],
    ["custom-types.ts", customTypesTpl],
    ["error-handler.ts", errorHandlerTpl],
  ]) {
    await renderToFile(createPath.lib("@typebox", file), template, {
      validationMessages: JSON.stringify(validationMessages),
      customTypesImport,
      settings: JSON.stringify({ ...defaultSettings, ...settings }),
    });
  }

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind !== "apiRoute") {
        continue;
      }

      const resolvedTypes = [
        entry.params.resolvedType,
        ...entry.validationDefinitions.flatMap((def) => {
          return def.target === "response"
            ? def.variants.map(({ resolvedType }) => resolvedType)
            : [def.schema.resolvedType];
        }),
      ].flatMap((resolvedType) => {
        return resolvedType
          ? [
              {
                ...resolvedType,
                text: typeboxLiteralText(resolvedType.text, pluginoptions),
              },
            ]
          : [];
      });

      const requestSchemas: Array<{
        target: RequestValidationTarget;
        methods: Array<{
          route: string;
          method: string;
          target: RequestValidationTarget;
          schema: RequestValidationDefinition["schema"];
          runtimeValidation?: string;
          customErrors?: string;
        }>;
      }> = (
        [
          ...new Set(
            entry.validationDefinitions.flatMap(({ target }) => {
              return Object.keys(RequestValidationTargets).includes(target)
                ? [target]
                : [];
            }),
          ),
        ] as Array<RequestValidationTarget>
      ).map((target) => {
        return {
          target,
          methods: entry.methods.flatMap((method) => {
            const def = entry.validationDefinitions.find((e) => {
              return e.method === method ? e.target === target : false;
            }) as RequestValidationDefinition;
            return def
              ? [
                  {
                    route: entry.name,
                    method,
                    target,
                    schema: def.schema,
                    ...(def.runtimeValidation === undefined
                      ? {}
                      : {
                          runtimeValidation: JSON.stringify(
                            def.runtimeValidation,
                          ),
                        }),
                    ...(def.customErrors === undefined
                      ? {}
                      : {
                          customErrors: JSON.stringify(def.customErrors),
                        }),
                  },
                ]
              : [];
          }),
        };
      });

      const responseSchemas: Array<{
        method: string;
        variants: Array<
          ResponseValidationDefinition["variants"][number] & {
            route: string;
            target: ValidationTarget;
            runtimeValidation?: string;
            customErrors?: string;
          }
        >;
      }> = entry.methods.flatMap((method) => {
        const def = entry.validationDefinitions.find((e) => {
          return e.method === method ? e.target === "response" : false;
        }) as ResponseValidationDefinition;
        return def
          ? [
              {
                method,
                variants: def.variants.map((variant) => {
                  return {
                    route: entry.name,
                    target: "response",
                    ...variant,
                    ...(def.runtimeValidation === undefined
                      ? {}
                      : {
                          runtimeValidation: JSON.stringify(
                            def.runtimeValidation,
                          ),
                        }),
                    ...(def.customErrors === undefined
                      ? {}
                      : { customErrors: JSON.stringify(def.customErrors) }),
                  };
                }),
              },
            ]
          : [];
      });

      await renderToFile(
        createPath.libApi(entry.name, "schemas.ts"),
        schemasTpl,
        {
          route: entry,
          resolvedTypes,
          requestSchemas,
          responseSchemas,
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
