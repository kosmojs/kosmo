import { dirname, join, resolve } from "node:path";

import crc from "crc/crc32";
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
  PluginOptionsResolved,
  ResolvedEntry,
  RouteEntry,
} from "@/types";

import { resolveRouteSignature, typeResolverFactory } from "../ast";
import { cacheFactory } from "../cache";
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

  const pathTokens = pathTokensFactory(dirname(file));

  return {
    id: `${file.replace(/\W+/g, "_")}_${crc(file)}`,
    name: pathTokens.map((e) => e.orig).join("/"),
    folder,
    file,
    fileFullpath,
    pathTokens,
  };
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
    const { id, name, folder, file, fileFullpath, pathTokens } = entry;

    const handler: ResolverSignature["handler"] = async () => {
      const entry: PageRoute = {
        id,
        name,
        pathTokens,
        params: {
          schema: pathTokens.flatMap((e) => (e.param ? [e.param] : [])),
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

  let resolveTypes = false;

  for (const { options } of generators) {
    if (options?.resolveTypes) {
      resolveTypes = true;
    }
  }

  const {
    //
    literalTypesResolver,
    getSourceFile,
    refreshSourceFile,
  } = typeResolverFactory(pluginOptions);

  return (entry) => {
    const { id, name, file, folder, fileFullpath, pathTokens } = entry;

    const handler: ResolverSignature["handler"] = async (updatedFile) => {
      const paramsSchema = pathTokens.flatMap((e) => {
        return e.param ? [e.param] : [];
      });

      const optionalParams = paramsSchema.length
        ? !paramsSchema.some((e) => e.isRequired)
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
          payloadTypes,
          responseTypes,
          referencedFiles = [],
        } = await resolveRouteSignature(
          { id, fileFullpath, optionalParams },
          {
            withReferencedFiles: true,
            sourceFile: getSourceFile(fileFullpath),
            relpathResolver(path) {
              return join(sourceFolder, defaults.apiDir, dirname(file), path);
            },
          },
        );

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
              refinement: paramsRefinements?.at(index),
            };
          }),
          typeDeclarations,
          payloadTypes,
          responseTypes,
        });

        const resolvedTypes = resolveTypes
          ? literalTypesResolver(typesFileContent, {
              overrides: [...payloadTypes, ...responseTypes].reduce(
                (map: Record<string, string>, { id, skipValidation }) => {
                  if (skipValidation) {
                    map[id] = "never";
                  }
                  return map;
                },
                { [refineTypeName]: refineTypeName },
              ),
              withProperties: [params.id, ...payloadTypes.map((e) => e.id)],
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
          // text was needed at writing types.ts file, dropping from cache
          payloadTypes: payloadTypes.map(({ text, ...rest }) => {
            return {
              ...rest,
              resolvedType: resolvedTypes?.find((e) => e.name === rest.id),
            };
          }),
          responseTypes: responseTypes.map(({ text, ...rest }) => {
            return {
              ...rest,
              resolvedType: resolvedTypes?.find((e) => e.name === rest.id),
            };
          }),
          referencedFiles,
        });
      }

      const entry: ApiRoute = {
        id,
        name,
        pathTokens,
        params: cache.params,
        numericParams: cache.numericParams,
        optionalParams,
        folder,
        file,
        fileFullpath,
        methods: cache.methods,
        typeDeclarations: cache.typeDeclarations,
        payloadTypes: cache.payloadTypes,
        responseTypes: cache.responseTypes,
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
