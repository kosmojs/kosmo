import { dirname, join, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import mimeTypes from "mime-types";
import picomatch from "picomatch";
import { glob } from "tinyglobby";

import { resolveRouteSignature, typeResolverFactory } from "../ast";
import { cacheFactory } from "../cache";
import { defaults } from "../defaults";
import { pathResolver } from "../paths";
import { render, renderToFile } from "../render";
import type {
  ApiRoute,
  PageRoute,
  PathTokenParamPart,
  PluginOptionsResolved,
  ResolvedEntry,
  RouteEntry,
  ValidationDefinition,
} from "../types";
import { pathTokensFactory } from "./base";

import resolvedTypesTpl from "./templates/resolved-types.hbs";
import typesFileTpl from "./templates/types.hbs";

export type ResolverSignature = {
  name: string;
  handler: (updatedFile?: string) => Promise<ResolvedEntry>;
};

export const API_INDEX_BASENAME = "index";
export const API_INDEX_PATTERN = `${API_INDEX_BASENAME}.ts`;

export const API_USE_BASENAME = "use";
export const API_USE_PATTERN = `${API_USE_BASENAME}.ts`;

export const PAGE_INDEX_BASENAME = "index";
export const PAGE_INDEX_PATTERN = `${PAGE_INDEX_BASENAME}.{tsx,vue}`;

export const PAGE_LAYOUT_BASENAME = "layout";
export const PAGE_LAYOUT_PATTERN = `${PAGE_LAYOUT_BASENAME}.{tsx,vue}`;

const ROUTE_FILE_PATTERNS = [
  // match index files in api dir
  `${defaults.apiDir}/**/${API_INDEX_PATTERN}`,
  // match use files in api dir
  `${defaults.apiDir}/**/${API_USE_PATTERN}`,
  // match index files in pages dir
  `${defaults.pagesDir}/**/${PAGE_INDEX_PATTERN}`,
  // match layout files in pages dir
  `${defaults.pagesDir}/**/${PAGE_LAYOUT_PATTERN}`,
];

export const scanRoutes = async ({
  appRoot,
  sourceFolder,
}: Pick<PluginOptionsResolved, "appRoot" | "sourceFolder">) => {
  const { createPath } = pathResolver({ appRoot, sourceFolder });
  return glob(ROUTE_FILE_PATTERNS, {
    cwd: createPath.src(),
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: [
      // ignore top-level matches, routes resides in folders, even index route
      `${defaults.apiDir}/${API_INDEX_PATTERN}`,
      `${defaults.apiDir}/${API_USE_PATTERN}`,
      `${defaults.pagesDir}/${PAGE_INDEX_PATTERN}`,
      `${defaults.pagesDir}/${PAGE_LAYOUT_PATTERN}`,
    ],
  });
};

export const isRouteFile = (
  file: string,
  {
    appRoot,
    sourceFolder,
  }: Pick<PluginOptionsResolved, "appRoot" | "sourceFolder">,
):
  | [
      // Either `apiDir` or `pagesDir`
      folder: string,
      // Path to a file within the folder, nested at least one level deep
      file: string,
    ]
  | false => {
  const [_sourceFolder, folder, ...rest] = resolve(appRoot, file)
    .replace(`${appRoot}/${defaults.srcDir}/`, "")
    .split("/");

  /**
   * Ensure the file:
   * - is under the correct source root (`sourceFolder`)
   * - belongs to a known route folder (`apiDir` or `pagesDir`)
   * - is nested at least one level deep (not a direct child of the folder)
   * */
  if (!folder || _sourceFolder !== sourceFolder || rest.length < 2) {
    return false;
  }

  return picomatch.isMatch(join(folder, ...rest), ROUTE_FILE_PATTERNS)
    ? [folder, rest.join("/")]
    : false;
};

export const isApiRoute = (file: string) => {
  return picomatch.matchBase(file, `**/${API_INDEX_PATTERN}`);
};

export const isApiUse = (file: string) => {
  return picomatch.matchBase(file, `**/${API_USE_PATTERN}`);
};

export const isPageRoute = (file: string) => {
  return picomatch.matchBase(file, `**/${PAGE_INDEX_PATTERN}`);
};

export const isPageLayout = (file: string) => {
  return picomatch.matchBase(file, `**/${PAGE_LAYOUT_PATTERN}`);
};

export const createRouteEntry = (
  fileFullpath: string,
  {
    appRoot,
    sourceFolder,
  }: Pick<PluginOptionsResolved, "appRoot" | "sourceFolder">,
): RouteEntry | undefined => {
  // scanner already is doing a great job on matching only relevant files
  // but doing a double check here to make sure only needed files added to stack
  const resolvedPaths = isRouteFile(fileFullpath, { appRoot, sourceFolder });

  if (!resolvedPaths) {
    return;
  }

  const [folder, file] = resolvedPaths;

  const id = `${file.replace(/\W+/g, "_")}_${crc(file)}`;
  const name = dirname(file);

  try {
    const [pathTokens, pathPattern] = pathTokensFactory(dirname(file));
    return { id, name, folder, file, fileFullpath, pathTokens, pathPattern };
  } catch (
    // biome-ignore lint: any
    error: any
  ) {
    console.error(
      `❗${styleText("red", "ERROR")}: Failed parsing path for "${styleText("cyan", file)}"`,
    );
    console.error(error);
    return;
  }
};

type ResolverFactory = (
  pluginOptions: PluginOptionsResolved,
) => (entry: RouteEntry) => ResolverSignature;

export const pageLayoutResolverFactory: ResolverFactory = () => {
  return (entry) => {
    const { name } = entry;

    const handler: ResolverSignature["handler"] = async () => {
      return {
        kind: "pageLayout",
        entry,
      };
    };

    return { name, handler };
  };
};

export const pageRouteResolverFactory: ResolverFactory = () => {
  return (entry) => {
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
  };
};

export const apiUseResolverFactory: ResolverFactory = () => {
  return (entry) => {
    const { name } = entry;

    const handler: ResolverSignature["handler"] = async () => {
      return {
        kind: "apiUse",
        entry,
      };
    };

    return { name, handler };
  };
};

export const apiRouteResolverFactory: ResolverFactory = (pluginOptions) => {
  const {
    appRoot,
    sourceFolder,
    generators = [],
    refineTypeName,
  } = pluginOptions;

  const resolveTypes = generators.some((e) => e.options?.resolveTypes);

  const {
    //
    literalTypesResolver,
    getSourceFile,
    refreshSourceFile,
  } = typeResolverFactory(pluginOptions);

  return ({
    id,
    name,
    file,
    folder,
    fileFullpath,
    pathTokens,
    pathPattern,
  }) => {
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

      const { getCache, persistCache } = cacheFactory(
        { id, file, fileFullpath },
        {
          appRoot,
          sourceFolder,
          extraContext: { resolveTypes },
        },
      );

      let cache = await getCache({ validate: true });

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
              return join(sourceFolder, defaults.apiDir, dirname(file), path);
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

        const typesFile = pathResolver({
          appRoot,
          sourceFolder,
        }).createPath.libApi(dirname(file), "types.ts");

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

        params.resolvedType = resolvedTypes?.find((e) => e.name === params.id);

        cache = await persistCache({
          params,
          methods,
          typeDeclarations,
          numericParams,
          referencedFiles,
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
        });
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
          (e) => resolve(appRoot, e),
        ),
      };

      return {
        kind: "apiRoute",
        entry,
      };
    };

    return { name, handler };
  };
};
