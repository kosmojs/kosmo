import { useContext } from "preact/hooks";

import { RouterContext } from "./mdx";

import type { ParamsMap, paramNames } from "{{ createImport 'lib' 'params' }}";

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
