import { MDXProvider } from "@mdx-js/preact";
import { match, pathToRegexp } from "path-to-regexp";
import { type ComponentType, createContext, h, type VNode } from "preact";

import { paramNames } from "{{ createImport 'lib' 'params' }}";
import { base } from "{{ createImport 'libCore' }}";

export type RawRoute = {
  name: string;
  pathSegments: number | undefined;
  regexp: RegExp;
  extractParams: (path: string) => Route["params"];
  loader: () => Promise<RouteComponent>;
  layouts: Array<[name: string, source: () => Promise<LayoutComponent>]>;
};

type LayoutComponent = {
  default: ComponentType;
  loader?: (route: Route) => Promise<unknown>;
};

type RouteComponent = {
  default: ComponentType;
  frontmatter: Route["frontmatter"];
  loader?: (route: Route) => Promise<unknown>;
};

export type Route = {
  name: string;
  params: Record<string, string | Array<string>>;
  paramsEntries: [keys: Array<string>, values: Array<unknown>];
  frontmatter: Record<string, unknown>;
};

export const RouterContext = createContext<Route>({
  name: "",
  params: {},
  paramsEntries: [[], []],
  frontmatter: {},
});

export const RouterProvider = RouterContext.Provider;

export type ResolvedRoute = {
  component: VNode<{ value: Route }>;
  frontmatter: Route["frontmatter"];
  loaderData: Record<string, unknown>;
};

export const createRouter = (
  routes: Array<RawRoute>,
  app: ComponentType,
  opt: { components?: Record<string, ComponentType<never>> },
) => {
  const catchallRoute = createRoute(
    "NotFound",
    "",
    () => import("{{ createImport 'pages' '404.mdx' }}"),
    [],
  );

  const runLoader = async (
    key: string,
    route: Route,
    fetcher: (r: Route) => Promise<unknown>,
  ) => {
    if (typeof window === "undefined" || !window.__KOSMO_HYDRATION_DATA__) {
      return fetcher(route);
    }
    return key in window.__KOSMO_HYDRATION_DATA__
      ? window.__KOSMO_HYDRATION_DATA__[key]
      : fetcher(route);
  };

  return {
    async resolve(
      url: URL = new URL(window.location.href),
    ): Promise<ResolvedRoute> {
      const urlSegments = url.pathname.split("/").filter(Boolean).length;

      // 1: use lightweight `RegExp.test()` on linear scan - no capture allocation
      const matchedRoutes = routes.filter(({ regexp }) => {
        return regexp.test(url.pathname);
      });

      const matchedRoute =
        matchedRoutes.length > 1
          ? matchedRoutes.find(({ pathSegments }) => {
              return pathSegments === undefined || pathSegments === urlSegments;
            }) || catchallRoute
          : matchedRoutes.length === 1
            ? matchedRoutes[0]
            : catchallRoute;

      // 2: capture params only on matched route
      const params = matchedRoute
        ? matchedRoute.extractParams(url.pathname)
        : {};

      const { name } = matchedRoute;

      const routeExports = await matchedRoute.loader();

      const paramsEntries = (
        Array.isArray(paramNames[name as never])
          ? [
              [...paramNames[name as never]],
              [...paramNames[name as never]].map((key) => params[key]),
            ]
          : [
              // fallback
              Object.keys(params),
              Object.values(params),
            ]
      ) as never;

      const { frontmatter = {} } = routeExports;

      const route: Route = {
        name,
        params,
        paramsEntries,
        frontmatter,
      };

      const loaderData: Record<string, unknown> = {};

      if (routeExports.loader) {
        loaderData[name] = await runLoader(name, route, routeExports.loader);
      }

      const layouts: Array<{
        name: string;
        component: LayoutComponent["default"];
      }> = [];

      for (const [name, source] of matchedRoute.layouts || []) {
        const layout = await source();
        layouts.push({ name, component: layout.default });
        if (layout.loader) {
          loaderData[name] = await runLoader(name, route, layout.loader);
        }
      }

      const component = [{ name: "", component: app }, ...layouts].reduce(
        (children, { name, component }) => {
          return h(component, {
            children,
            frontmatter,
            loaderData: loaderData[name],
          } as never);
        },
        h(routeExports.default, {
          frontmatter,
          loaderData: loaderData[name],
        } as never),
      );

      return {
        component: h(
          RouterProvider,
          { value: route },
          h(MDXProvider, opt as never, component),
        ),
        frontmatter,
        loaderData,
      };
    },
  };
};

export const createRoute = (
  name: string,
  pathPattern: string,
  loader: RawRoute["loader"],
  layouts: RawRoute["layouts"],
): RawRoute => {
  const path = `${base}/${pathPattern}`.replace(/\/+/g, "/");

  const { regexp } = pathToRegexp(path, { sensitive: true });
  const matcher = match<Route["params"]>(path);

  return {
    name,
    regexp,
    pathSegments: name.includes("...")
      ? undefined
      : name.replace(/^index(\/?|$)/, "").split("/").length,
    extractParams: (path) => {
      const match = matcher(path);
      return match ? match.params : {};
    },
    loader,
    layouts,
  };
};
