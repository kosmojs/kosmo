import { navigateHref } from "@kosmojs/core/generators";

import { getRouteContext, type Route } from "./svelte";

import type { ParamsMap, paramNames } from "{{ createImport 'lib' 'params' }}";
import { type LinkProps, pageRouteMap } from "{{ createImport 'libCore' }}";

/**
 * A read-only view whose every read goes through `read()`,
 * so it follows the route across client-side navigations and,
 * read in markup or `$derived`, re-renders when the route changes.
 * */
const live = <T extends object>(read: () => T): T => {
  return new Proxy({} as T, {
    get: (_, key) => Reflect.get(read(), key),
    has: (_, key) => Reflect.has(read(), key),
    ownKeys: () => Reflect.ownKeys(read()),
    getOwnPropertyDescriptor(_, key) {
      const descriptor = Reflect.getOwnPropertyDescriptor(read(), key);
      // the empty target holds none of these keys,
      // and a proxy may only report a missing key as configurable
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
    set: () => false,
    deleteProperty: () => false,
    defineProperty: () => false,
  });
};

/**
 * These read Svelte context, so - like every getContext() call - they are only
 * valid during component initialisation: at the top level of a `<script>`,
 * never inside an event handler or a callback that runs later.
 *
 * `useRoute`, `useParams` and `useSearchParams` return live views:
 * a page is mounted anew on every navigation, but a layout stays mounted,
 * and reads through these views pick up the new route.
 * Destructuring at init takes a snapshot -
 * fine in a page, stale in a layout once the user navigates.
 * */
export function useRoute(): Route {
  const read = getRouteContext();
  return live(() => read());
}

export function useParams<T extends keyof ParamsMap>(): ParamsMap[T] {
  const read = getRouteContext();
  return live(() => read().params) as ParamsMap[T];
}

type SameLengthTuple<T extends readonly unknown[], U> = { [K in keyof T]: U };

/**
 * A snapshot taken at init - read it in a page,
 * or through `useRoute().paramsEntries` in a layout.
 * */
export function useParamsEntries<T extends keyof ParamsMap>(): [
  (typeof paramNames)[T],
  SameLengthTuple<(typeof paramNames)[T], unknown>,
] {
  const read = getRouteContext();
  return read().paramsEntries as never;
}

export function useSearchParams(): Route["searchParams"] {
  const read = getRouteContext();
  return live(() => read().searchParams);
}

/**
 * Reads loader data for the current page or one of its layouts.
 * Without a key, returns the page's own data.
 * For a layout, pass its path-qualified name (e.g. "dashboard/layout") -
 * context can't tell which layout it runs in.
 *
 * A snapshot taken at init. Layout loaders run again on every navigation;
 * a layout that shows their data reads it live,
 * through `useRoute().loaderData["dashboard/layout"]`.
 * */
export const useLoaderData = <T>(key?: string): T | undefined => {
  const route = getRouteContext()();
  return route.loaderData?.[key || route.name] as T;
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
