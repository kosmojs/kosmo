import { defaults } from "../defaults";
import type { PluginOptionsResolved, RouteEntry } from "../types";
import {
  apiRouteResolverFactory,
  apiUseResolverFactory,
  createRouteEntry,
  isApiRoute,
  isApiUse,
  isPageLayout,
  isPageRoute,
  pageLayoutResolverFactory,
  pageRouteResolverFactory,
  type ResolverSignature,
  scanRoutes,
} from "./resolve";

export * from "./nesting";
export * from "./resolve";

export const routesFactory = async (pluginOptions: PluginOptionsResolved) => {
  const { appRoot, sourceFolder } = pluginOptions;

  const apiRouteResolver = apiRouteResolverFactory(pluginOptions);
  const apiUseResolver = apiUseResolverFactory(pluginOptions);
  const pageRouteResolver = pageRouteResolverFactory(pluginOptions);
  const pageLayoutResolver = pageLayoutResolverFactory(pluginOptions);

  const resolversFactory = (routeFiles: Array<string>) => {
    const resolvers = new Map<
      string, // fileFullpath
      ResolverSignature
    >();

    const entries: Array<RouteEntry> = routeFiles.flatMap((file) => {
      const entry = createRouteEntry(file, pluginOptions);
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

  const routeFiles = await scanRoutes({ appRoot, sourceFolder });

  return {
    resolvers: resolversFactory(routeFiles),
    resolversFactory,
  };
};
