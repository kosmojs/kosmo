import { dirname, join, relative, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import { lookup } from "mrmime";

import {
  type ApiRoute,
  defaults,
  type PageRoute,
  type PathTokenParamPart,
  type ProjectSettings,
  type RouteEntry,
  type RouteResolverCacheFactory,
  type SourceFolder,
  type TypeboxOptions,
  type ValidationDefinition,
} from "@kosmojs/core";

import { astFactory } from "../ast";
import { pathResolver } from "../paths";
import { render, renderToFile } from "../render";
import * as templates from "../templates";
import type { ResolverSignature } from "./base";

export const resolverFactory = (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
  cacheFactory?: RouteResolverCacheFactory,
): Record<
  | "pageLayoutResolver"
  | "pageRouteResolver"
  | "apiUseResolver"
  | "apiRouteResolver",
  (entry: RouteEntry) => ResolverSignature
> => {
  const { generators } = sourceFolder;

  const { refineTypeName = defaults.refineTypeName } =
    typeof sourceFolder.config.validation === "object"
      ? ({ ...sourceFolder.config.validation } as TypeboxOptions)
      : {};

  const { typeResolverFactory, resolveRouteSignature } = astFactory();

  const resolveTypes = generators.some(({ meta }) => meta.resolveTypes);

  const { resolveTypes: typesResolver } = typeResolverFactory(
    projectSettings,
    sourceFolder,
    { refineTypeName },
  );

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
      const {
        id,
        name,
        folder,
        file,
        fileFullpath,
        pathTokens,
        pathPattern,
        honoPattern,
        h3Pattern,
      } = entry;

      const handler: ResolverSignature["handler"] = async () => {
        const entry: PageRoute = {
          id,
          name,
          pathTokens,
          pathPattern,
          honoPattern,
          h3Pattern,
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
        id,
        name,
        file,
        folder,
        fileFullpath,
        pathTokens,
        pathPattern,
        honoPattern,
        h3Pattern,
      } = entry;

      const handler: ResolverSignature["handler"] = async () => {
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
          ? cacheFactory(
              projectSettings,
              sourceFolder,
              { id, file, fileFullpath },
              { resolveTypes },
            )
          : undefined;

        let cache = cacheStore
          ? await cacheStore.get({ validate: true })
          : undefined;

        if (!cache) {
          const signature = (() => {
            try {
              return resolveRouteSignature(
                { id, name, fileFullpath },
                {
                  importSpecifierResolver(path) {
                    if (/^\.\.?\/?/.test(path)) {
                      return join(
                        defaults.appPrefix,
                        defaults.srcDir,
                        sourceFolder.name,
                        defaults.apiDir,
                        dirname(file),
                        path,
                      );
                    }
                    if (path.startsWith(`${defaults.srcPrefix}/`)) {
                      return join(
                        defaults.appPrefix,
                        defaults.srcDir,
                        sourceFolder.name,
                        path.replace(defaults.srcPrefix, ""),
                      );
                    }
                    return path;
                  },
                },
              );
            } catch (error) {
              // a file mid-edit; it resolves again once it parses
              console.warn(
                styleText(["bold", "red"], "✗ Failed parsing API route"),
              );
              console.warn(`  ${(error as Error).message}`);
              console.warn();
              return undefined;
            }
          })();

          const {
            typeDeclarations = [],
            paramsRefinements,
            methods = [],
            validationDefinitions = [],
          } = { ...signature };

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

          const typesFile = pathResolver(
            projectSettings,
            sourceFolder,
          ).createPath.libApi(dirname(file), "types.ts");

          const params: ApiRoute["params"] = {
            id: ["ParamsT", crc(name)].join(""),
            schema: paramsSchema,
            resolvedType: undefined,
          };

          const typesFileContent = render(templates.typesFile, {
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

          // every file the validation types reach and the JSON Schema each type evaluates to
          const { resolvedTypes, referencedFiles } = typesResolver(
            { file: typesFile, source: typesFileContent, route: name },
            {
              names: [params.id, ...validationTypes.map(({ id }) => id)],
              evaluate: resolveTypes,
              // a payload that ends up in a database,
              // and a response that may carry more than it declares,
              // reject undeclared properties
              closedTypes: validationDefinitions.flatMap((def) => {
                if (def.target === "response") {
                  return def.variants.map(({ id }) => id);
                }
                return def.target === "json" || def.target === "form"
                  ? [def.schema.id]
                  : [];
              }),
            },
          );

          // types.ts holds the route's own declarations, imports pointing to the source;
          // required by core generators (like fetch)
          await renderToFile(typesFile, typesFileContent, {});

          params.resolvedType = resolvedTypes?.find(
            (e) => e.name === params.id,
          );

          cache = {
            // placeholder hashes; if cacheFactory given,
            // they are replaced by persistCache
            hash: 0,
            referencedFiles: Object.fromEntries(
              referencedFiles.map((file) => [
                relative(projectSettings.root, file),
                0,
              ]),
            ),
            // real values
            params,
            methods,
            typeDeclarations,
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

                  const contentType = lookup(variant.contentType);

                  if (!contentType) {
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
              const contentType = lookup(def.contentType);
              if (!contentType) {
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
          honoPattern,
          h3Pattern,
          params: cache.params,
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
            (e) => resolve(projectSettings.root, e),
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
