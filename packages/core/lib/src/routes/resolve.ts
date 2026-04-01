import { dirname, join, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import mimeTypes from "mime-types";

import type {
  ApiRoute,
  PageRoute,
  PathTokenParamPart,
  RouteEntry,
  RouteResolverCacheFactory,
  SourceFolder,
  ValidationDefinition,
} from "@kosmojs/core";

import { astFactory } from "../ast";
import { defaults } from "../defaults";
import { pathResolver } from "../paths";
import { render, renderToFile } from "../render";
import type { ResolverSignature } from "./base";

import resolvedTypesTpl from "./templates/resolved-types.hbs";
import typesFileTpl from "./templates/types.hbs";

export const resolverFactory = (
  sourceFolder: SourceFolder,
  cacheFactory?: RouteResolverCacheFactory,
): Record<
  | "pageLayoutResolver"
  | "pageRouteResolver"
  | "apiUseResolver"
  | "apiRouteResolver",
  (entry: RouteEntry) => ResolverSignature
> => {
  const {
    //
    generators = [],
    refineTypeName = defaults.refineTypeName,
  } = sourceFolder.config;

  const { typeResolverFactory, resolveRouteSignature } = astFactory();

  const resolveTypes = generators.some(({ meta }) => meta.resolveTypes);

  const {
    //
    literalTypesResolver,
    getSourceFile,
    refreshSourceFile,
  } = typeResolverFactory(sourceFolder);

  return {
    pageLayoutResolver(entry) {
      const { name } = entry;

      const handler: ResolverSignature["handler"] = async () => {
        return {
          kind: "pageLayout",
          entry,
        };
      };

      return { name, handler };
    },

    pageRouteResolver(entry) {
      const { id, name, folder, file, fileFullpath, pathTokens, pathPattern } =
        entry;

      const handler: ResolverSignature["handler"] = async () => {
        const entry: PageRoute = {
          id,
          name,
          pathTokens,
          pathPattern,
          params: {
            schema: pathTokens.flatMap((e) => {
              return e.parts.filter((p) => p.type === "param");
            }),
          },
          folder,
          file,
          fileFullpath,
        };

        return {
          kind: "pageRoute",
          entry,
        };
      };

      return { name, handler };
    },

    apiUseResolver(entry) {
      const { name } = entry;

      const handler: ResolverSignature["handler"] = async () => {
        return {
          kind: "apiUse",
          entry,
        };
      };

      return { name, handler };
    },

    apiRouteResolver(entry) {
      const {
        //
        id,
        name,
        file,
        folder,
        fileFullpath,
        pathTokens,
        pathPattern,
      } = entry;

      const handler: ResolverSignature["handler"] = async (updatedFile) => {
        const paramsSchema: Array<PathTokenParamPart> = pathTokens.flatMap(
          (e) => {
            return e.parts.flatMap((p) => {
              return p.type === "param" ? [p] : [];
            });
          },
        );

        const optionalParams = paramsSchema.length
          ? paramsSchema.filter((e) => e.kind === "required").length === 0
          : true;

        const cacheStore = cacheFactory
          ? cacheFactory({ id, file, fileFullpath }, sourceFolder, {
              resolveTypes,
            })
          : undefined;

        let cache = cacheStore
          ? await cacheStore.get({ validate: true })
          : undefined;

        if (!cache) {
          if (updatedFile === fileFullpath) {
            await refreshSourceFile(fileFullpath);
          }

          const {
            typeDeclarations,
            paramsRefinements,
            methods,
            validationDefinitions,
            referencedFiles = [],
          } = await resolveRouteSignature(
            { id, name, fileFullpath, optionalParams },
            {
              withReferencedFiles: true,
              sourceFile: getSourceFile(fileFullpath),
              relpathResolver(path) {
                return join(
                  sourceFolder.name,
                  defaults.apiDir,
                  dirname(file),
                  path,
                );
              },
            },
          );

          const validationTypes = validationDefinitions.flatMap<{
            id: string;
            text: string;
          }>((def) => {
            return def.target === "response"
              ? def.variants.flatMap(({ id, body }) => {
                  return body ? [{ id, text: body }] : [];
                })
              : [def.schema];
          });

          const numericParams = paramsRefinements
            ? paramsRefinements.flatMap(({ text, index }) => {
                if (text === "number") {
                  const param = paramsSchema.at(index);
                  return param ? [param.name] : [];
                }
                return [];
              })
            : [];

          const typesFile = pathResolver(sourceFolder).createPath.libApi(
            dirname(file),
            "types.ts",
          );

          const params: ApiRoute["params"] = {
            id: ["ParamsT", crc(name)].join(""),
            schema: paramsSchema,
            resolvedType: undefined,
          };

          const typesFileContent = render(typesFileTpl, {
            params,
            paramsSchema: paramsSchema.map((param, index) => {
              return {
                ...param,
                isRequired: param.kind === "required",
                isSplat: param.kind === "splat",
                refinement: paramsRefinements?.at(index),
              };
            }),
            typeDeclarations,
            validationTypes,
          });

          const resolvedTypes = resolveTypes
            ? literalTypesResolver(typesFileContent, {
                stripComments: true,
                overrides: { [refineTypeName]: refineTypeName },
                withProperties: [
                  params.id,
                  ...validationTypes.flatMap(({ id }) => id),
                ],
              })
            : undefined;

          /**
           * Deploy types.ts file; required by core generators (like fetch).
           * If types resolved, write resolved types;
           * otherwise write original types extracted from API route.
           * */
          await renderToFile(
            typesFile,
            resolvedTypes ? resolvedTypesTpl : typesFileContent,
            { resolvedTypes },
          );

          params.resolvedType = resolvedTypes?.find(
            (e) => e.name === params.id,
          );

          cache = {
            // placeholder values, if cacheFactory given,
            // they will be replaced by persistCache
            hash: 0,
            referencedFiles: {},
            // real values
            params,
            methods,
            typeDeclarations,
            numericParams,
            validationDefinitions: validationDefinitions.map((def) => {
              return {
                ...def,
                ...(def.target === "response"
                  ? {
                      variants: def.variants.map((variant) => {
                        return {
                          ...variant,
                          resolvedType: resolvedTypes?.find(
                            (e) => e.name === variant.id,
                          ),
                        };
                      }),
                    }
                  : {
                      schema: {
                        ...def.schema,
                        resolvedType: resolvedTypes?.find(
                          (e) => e.name === def.schema.id,
                        ),
                      },
                    }),
              };
            }),
          };

          if (cacheStore) {
            const { referencedFiles: _void, ...rest } = cache;
            cache = await cacheStore.set({ ...rest, referencedFiles });
          }
        }

        const validationDefinitions = cache.validationDefinitions.flatMap(
          (def) => {
            let augmentedDef: ValidationDefinition | undefined = def;

            if (def.target === "response") {
              augmentedDef = {
                ...def,
                variants: def.variants.flatMap((variant, i) => {
                  if (typeof variant.contentType !== "string") {
                    return [variant];
                  }

                  if (variant.contentType.includes("/")) {
                    return [variant];
                  }

                  const contentType = mimeTypes.lookup(variant.contentType);

                  if (contentType === false) {
                    console.warn(
                      styleText(
                        ["bold", "red"],
                        "✗ Failed resolving Response Content Type",
                      ),
                    );
                    console.warn(
                      `  Invalid value provided for mime-types lookup - ${variant.contentType}`,
                    );
                    console.warn(
                      styleText(
                        ["cyan"],
                        `  Response variant #${i} excluded from route schemas`,
                      ),
                    );
                    console.warn(`  Route: ${name}; Method: ${def.method}`);
                    console.warn();
                    return [];
                  }

                  return [{ ...variant, contentType }];
                }),
              };
            } else if (def.contentType && !def.contentType.includes("/")) {
              const contentType = mimeTypes.lookup(def.contentType);
              if (contentType === false) {
                console.warn(
                  styleText(
                    ["bold", "red"],
                    "✗ Failed resolving Response Content Type",
                  ),
                );
                console.warn(
                  `  Invalid value provided for mime-types lookup - ${def.contentType}`,
                );
                console.warn(`  Route: ${name}; Method: ${def.method}`);
                console.warn();
              } else {
                augmentedDef = { ...def, contentType };
              }
            }

            return augmentedDef ? [augmentedDef] : [];
          },
        );

        const entry: ApiRoute = {
          id,
          name,
          pathTokens,
          pathPattern,
          params: cache.params,
          numericParams: cache.numericParams,
          optionalParams,
          folder,
          file,
          fileFullpath,
          methods: cache.methods,
          typeDeclarations: cache.typeDeclarations,
          validationDefinitions,
          referencedFiles: Object.keys(cache.referencedFiles).map(
            // expand referenced files path,
            // they are stored as relative in cache
            (e) => resolve(sourceFolder.root, e),
          ),
        };

        return {
          kind: "apiRoute",
          entry,
        };
      };

      return { name, handler };
    },
  };
};
