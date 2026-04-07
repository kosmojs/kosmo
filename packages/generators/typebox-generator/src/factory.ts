import {
  type RequestValidationDefinition,
  type RequestValidationTarget,
  RequestValidationTargets,
  type ResolvedEntry,
  type ResponseValidationDefinition,
  type ValidationTarget,
} from "@kosmojs/core";
import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  typeboxLiteralText,
} from "@kosmojs/lib";

import * as templates from "./templates";
import type { Options, Settings } from "./types";

const defaultSettings: Settings = {
  exactOptionalPropertyTypes: true,
};

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { createPath, createImport, createImportHelpers } =
      pathResolver(sourceFolder);

    const { renderToFile: deployLibFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
      },
    });

    const {
      validationMessages = {},
      customTypesImport = createImport.lib(["@typebox/custom-types"], {
        origin: "lib",
      }),
      settings,
    } = { ...options };

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
                  text: typeboxLiteralText(resolvedType.text, sourceFolder),
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

        await deployLibFile(
          createPath.libApi(entry.name, "schemas.ts"),
          templates.schemas,
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
      meta,
      options,

      async start() {
        for (const [file, template] of [
          ["custom-types.ts", templates.libTypeboxCustomTypes],
          ["error-handler.ts", templates.libTypeboxErrorHandler],
          ["index.ts", templates.libTypeboxIndex],
          ["setup.ts", templates.libTypeboxSetup],
        ]) {
          await deployLibFile(createPath.lib("@typebox", file), template, {
            validationMessages: JSON.stringify(validationMessages),
            customTypesImport,
            settings: JSON.stringify({ ...defaultSettings, ...settings }),
          });
        }
      },

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
  },
);
