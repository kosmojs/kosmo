import { match, pathToRegexp } from "path-to-regexp";
import { type Component, createContext } from "svelte";

import { parseSearchParams } from "@kosmojs/core";

import { paramNames } from "{{ createImport 'lib' 'params' }}";
import { base } from "{{ createImport 'libCore' }}";

/**
 * The loose component type for anything resolved dynamically from a `.svelte`
 * module's default export.
 *
 * It must be `any`-propped, not `never`-propped: a `Component<never>` is a
 * function accepting `never`, so - by parameter contravariance - no real
 * component is assignable to it and `<Layout />` fails to typecheck.
 * */
export type AnyComponent = Component<any, any, any>;

export type RawRoute = {
  name: string;
  pathSegments: number | undefined;
  regexp: RegExp;
  extractParams: (path: string) => Route["params"];
  loader: () => Promise<RouteModule>;
  layouts: Array<[name: string, source: () => Promise<LayoutModule>]>;
};

type Loader = (
  route: Pick<Route, "name" | "params" | "paramsEntries" | "searchParams">,
) => Promise<unknown> | undefined;

/**
 * `.svelte` modules export their component as `default`; an optional data
 * `loader` comes from a `<script module>` block.
 * */
type LayoutModule = {
  default: AnyComponent;
  loader?: Loader;
};

type RouteModule = {
  default: AnyComponent;
  loader?: Loader;
};

/**
 * Props of <Layouts>, the fixed root component every route renders through.
 * */
export type LayoutsProps = {
  app: AnyComponent;
  layouts: Array<AnyComponent>;
  page: AnyComponent;
  route: Route;
};

/**
 * Preact can prebuild the whole tree and hand back a VNode; Svelte cannot -
 * components are constructors, not values. So the resolved "component" is a
 * (constructor, props) pair and the entry templates feed it to
 * mount()/hydrate()/render().
 * */
export type RouteComponent = {
  Component: Component<LayoutsProps>;
  props: LayoutsProps;
};

export type Route = {
  name: string;
  params: Record<string, string | Array<string>>;
  paramsEntries: [keys: Array<string>, values: Array<unknown>];
  searchParams: Record<string, unknown>;
  loaderData: Record<string, unknown>;
};

/**
 * Route context, the Svelte counterpart to MDX's Preact RouterContext.
 *
 * Holds a getter rather than the value: <Layouts> receives `route` as a prop,
 * and reading a prop into a non-reactive position at init is exactly what
 * Svelte's `state_referenced_locally` check flags. The getter also keeps reads
 * current if the wrapper is ever reused instead of remounted.
 *
 * `createContext` returns a typed [get, set] pair and `get` throws when no
 * parent called `set`, so a page rendered outside <Layouts> fails loudly.
 * */
export const [getRouteContext, setRouteContext] = createContext<() => Route>();

export const createRouter = (
  routes: Array<RawRoute>,
  app: AnyComponent,
  Layouts: Component<LayoutsProps>,
) => {
  const catchallRoute = createRoute(
    "NotFound",
    "",
    () => import("{{ createImport 'pages' '404.svelte' }}"),
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

      const loaderData: Record<string, unknown> = {};

      loaderData[name] = await runLoader(name, () => {
        return routeModule.loader
          ? routeModule.loader({ name, params, paramsEntries, searchParams })
          : undefined; // should not survive serialization if no loader defined
      });

      const layouts: Array<AnyComponent> = [];

      for (const [layoutName, source] of matchedRoute.layouts || []) {
        const layoutModule = await source();
        layouts.push(layoutModule.default);
        const key = `${layoutName}/layout`;
        loaderData[key] = await runLoader(key, () => {
          return layoutModule.loader
            ? layoutModule.loader({
                name: layoutName,
                params,
                paramsEntries,
                searchParams,
              })
            : undefined; // should not survive serialization if no loader defined
        });
      }

      const route: Route = {
        name,
        params,
        paramsEntries,
        searchParams,
        loaderData,
      };

      return {
        // <Layouts> folds [app, ...layouts] around the page - Svelte has no
        // vnode children to reduce over the way `h(layout, { children })` does.
        component: {
          Component: Layouts,
          props: { app, layouts, page: routeModule.default, route },
        } satisfies RouteComponent,
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
