import {
  defaults,
  type PluginOptionsResolved,
  type RouteEntry,
} from "@kosmojs/devlib";

import {
  apiRouteResolverFactory,
  createRouteEntry,
  isPageFile,
  pageLayoutResolverFactory,
  pageRouteResolverFactory,
  type ResolverSignature,
  scanRoutes,
} from "./routes/resolve";

export * from "./routes/resolve";

export default async (pluginOptions: PluginOptionsResolved) => {
  const { appRoot, sourceFolder } = pluginOptions;

  const apiRouteResolver = apiRouteResolverFactory(pluginOptions);
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
        resolvers.set(entry.fileFullpath, apiRouteResolver(entry));
      } else if (entry.folder === defaults.pagesDir) {
        const pageFile = isPageFile(entry.file);
        if (pageFile?.kind === "index") {
          resolvers.set(entry.fileFullpath, pageRouteResolver(entry));
        } else if (pageFile?.kind === "layout") {
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
