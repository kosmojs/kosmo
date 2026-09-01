import { MDXProvider } from "@mdx-js/preact";
import { match, pathToRegexp } from "path-to-regexp";
import { type ComponentType, createContext, h, type VNode } from "preact";

import { parseSearchParams } from "@kosmojs/core";

import { paramNames } from "{{ createImport 'lib' 'params' }}";
import { base } from "{{ createImport 'libCore' }}";

export type RawRoute = {
  name: string;
  regexp: RegExp;
  extractParams: (path: string) => Route["params"];
  loader: () => Promise<RouteModule>;
  layouts: Array<[name: string, source: () => Promise<LayoutModule>]>;
};

type Loader = (
  route: Pick<Route, "name" | "params" | "paramsEntries" | "searchParams">,
) => Promise<unknown> | undefined;

type LayoutModule = {
  default: ComponentType;
  loader?: Loader;
};

type RouteModule = {
  default: ComponentType;
  frontmatter: Route["frontmatter"];
  loader?: Loader;
};

export type RouteComponent = VNode<{ value: Route }>;

export type Route = {
  name: string;
  params: Record<string, string | Array<string>>;
  paramsEntries: [keys: Array<string>, values: Array<unknown>];
  searchParams: Record<string, unknown>;
  frontmatter: Record<string, unknown>;
  loaderData: Record<string, unknown>;
};

export const RouterContext = createContext<Route>({
  name: "",
  params: {},
  paramsEntries: [[], []],
  searchParams: {},
  frontmatter: {},
  loaderData: {},
});

export const RouterProvider = RouterContext.Provider;

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

  const runLoader = async (key: string, fetcher: () => ReturnType<Loader>) => {
    if (typeof window === "undefined" || !window.__KOSMO_HYDRATION_DATA__) {
      return fetcher();
    }
    return key in window.__KOSMO_HYDRATION_DATA__
      ? window.__KOSMO_HYDRATION_DATA__[key]
      : fetcher();
  };

  return {
    async resolve(url: URL = new URL(window.location.href)) {
      const searchParams = parseSearchParams(url);

      // The routes array is generated pre-sorted by specificity
      // (static beats required beats optional beats splat, token by token),
      // the same ordering the SSR server registers routes in -
      // so the first pattern that matches IS the most specific one,
      // and CSR resolution stays consistent with SSR.
      // A route with optional parameters matches a range of segment counts,
      // which is why no segment-count heuristic can disambiguate here.
      // Lightweight `RegExp.test()` on linear scan - no capture allocation.
      const matchedRoute =
        routes.find(({ regexp }) => {
          return regexp.test(url.pathname);
        }) || catchallRoute;

      const params = matchedRoute
        ? matchedRoute.extractParams(url.pathname)
        : {};

      const { name } = matchedRoute;

      const routeModule = await matchedRoute.loader();

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

      const { frontmatter = {} } = routeModule;

      const loaderData: Record<string, unknown> = {};

      loaderData[name] = await runLoader(name, () => {
        return routeModule.loader
          ? routeModule.loader({ name, params, paramsEntries, searchParams })
          : undefined; // should not survive serialization if no loader defined
      });

      const layouts: Array<{
        name: string;
        component: LayoutModule["default"];
      }> = [];

      for (const [name, source] of matchedRoute.layouts || []) {
        const layoutModule = await source();
        layouts.push({ name, component: layoutModule.default });
        const key = `${name}/layout`;
        loaderData[key] = await runLoader(key, () => {
          return layoutModule.loader
            ? layoutModule.loader({ name, params, paramsEntries, searchParams })
            : undefined; // should not survive serialization if no loader defined
        });
      }

      const route: Route = {
        name,
        params,
        paramsEntries,
        searchParams,
        frontmatter,
        loaderData,
      };

      const component = [{ name: "", component: app }, ...layouts].reduce(
        (children, { component }) => {
          return h(component, { children } as never);
        },
        h(routeModule.default, {}),
      );

      return {
        component: h(
          RouterProvider,
          { value: route },
          h(MDXProvider, opt as never, component),
        ),
        route,
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
  // strip trailing slash (keeping a sole "/") so the base-joined index route
  // matches both with and without it - "/docs/" as a pattern rejects "/docs"
  const path = `${base}/${pathPattern}`
    .replace(/\/+/g, "/")
    .replace(/(.+)\/$/, "$1");

  const { regexp } = pathToRegexp(path, { sensitive: true });
  const matcher = match<Route["params"]>(path);

  return {
    name,
    regexp,
    extractParams: (path) => {
      const match = matcher(path);
      return match ? match.params : {};
    },
    loader,
    layouts,
  };
};
