import {
  defaults,
  type ProjectSettings,
  type RouteEntry,
  type RouteResolverCacheFactory,
  type SourceFolder,
} from "@kosmojs/core";

import {
  createRouteEntry,
  isApiRoute,
  isApiUse,
  isPageLayout,
  isPageRoute,
  type ResolverSignature,
  scanRoutes,
} from "./base";
import { resolverFactory } from "./resolve";

export * from "./base";
export * from "./nesting";
export * from "./paths";

export const routesFactory = async (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
  cacheFactory?: RouteResolverCacheFactory,
) => {
  const {
    apiRouteResolver,
    apiUseResolver,
    pageRouteResolver,
    pageLayoutResolver,
  } = resolverFactory(projectSettings, sourceFolder, cacheFactory);

  const resolversFactory = (routeFiles: Array<string>) => {
    const resolvers = new Map<
      string, // fileFullpath
      ResolverSignature
    >();

    const entries: Array<RouteEntry> = routeFiles.flatMap((file) => {
      const entry = createRouteEntry(projectSettings, sourceFolder, file);
      return entry ? [entry] : [];
    });

    for (const entry of entries) {
      if (entry.folder === defaults.apiDir) {
        if (isApiRoute(entry.file)) {
          resolvers.set(entry.fileFullpath, apiRouteResolver(entry));
        } else if (isApiUse(entry.file)) {
          resolvers.set(entry.fileFullpath, apiUseResolver(entry));
        }
      } else if (entry.folder === defaults.pagesDir) {
        if (isPageRoute(entry.file)) {
          resolvers.set(entry.fileFullpath, pageRouteResolver(entry));
        } else if (isPageLayout(entry.file)) {
          resolvers.set(entry.fileFullpath, pageLayoutResolver(entry));
        }
      }
    }

    return resolvers;
  };

  const routeFiles = await scanRoutes(projectSettings, sourceFolder);

  return {
    resolvers: resolversFactory(routeFiles),
    resolversFactory,
  };
};
