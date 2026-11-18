import { useContext } from "preact/hooks";

import { navigateHref } from "@kosmojs/core/generators";

import { RouterContext } from "./mdx";

import type { ParamsMap, paramNames } from "{{ createImport 'lib' 'params' }}";
import { type LinkProps, pageRouteMap } from "{{ createImport 'libCore' }}";

/**
 * Hooks read the route context on every render.
 * A client-side navigation re-renders the layouts it keeps mounted,
 * so they always see the current route; the page is mounted anew.
 * */
export function useRoute() {
  return structuredClone(useContext(RouterContext));
}

export function useParams<T extends keyof ParamsMap>(): ParamsMap[T] {
  return useRoute().params as ParamsMap[T];
}

type SameLengthTuple<T extends readonly unknown[], U> = { [K in keyof T]: U };

export function useParamsEntries<T extends keyof ParamsMap>(): [
  (typeof paramNames)[T],
  SameLengthTuple<(typeof paramNames)[T], unknown>,
] {
  return useRoute().paramsEntries as never;
}

export function useSearchParams() {
  return useRoute().searchParams;
}

/**
 * Reads loader data for the current page or one of its layouts.
 * Without a key, returns the page's own data.
 * For a layout, pass its path-qualified name (e.g. "dashboard/layout") -
 * a hook can't tell which layout it runs in.
 * */
export const useLoaderData = <T>(key?: string): T | undefined => {
  const route = useRoute();
  return route.loaderData?.[key || route.name] as T;
};

/**
 * Reads the current route's frontmatter.
 * */
export const useFrontmatter = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(): T => {
  return useRoute().frontmatter as T;
};

/**
 * Navigate to a route by the same typed tuple `<Link to>` takes.
 * Unlike the hooks, callable anywhere - an event handler, an effect, after an await.
 *
 * Settles once the destination is rendered;
 * a navigation superseded by a newer one settles quietly.
 * */
export const navigate = (
  to: LinkProps,
  opt?: { query?: Record<string | number, unknown>; replace?: boolean },
): Promise<void> => {
  const [key, ...params] = to;
  const href = pageRouteMap[key]?.path(params as never, opt?.query);
  if (href === undefined) {
    return Promise.reject(new Error(`Unknown route: ${key}`));
  }
  return navigateHref(href, { replace: opt?.replace });
};
