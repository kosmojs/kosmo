import { getRouteContext } from "./svelte";

import type { ParamsMap, paramNames } from "{{ createImport 'lib' 'params' }}";

/**
 * These read Svelte context, so - like every getContext() call - they are only
 * valid during component initialisation: at the top level of a `<script>`,
 * never inside an event handler or a callback that runs later.
 * */
export function useRoute() {
  return getRouteContext()();
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
 * context can't tell which layout it runs in.
 * */
export const useLoaderData = <T>(key?: string): T | undefined => {
  const route = useRoute();
  return route.loaderData?.[key || route.name] as T;
};
