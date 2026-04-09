import { useContext } from "preact/hooks";

import { RouterContext } from "./mdx";

import type { ParamsMap } from "{{ createImport 'lib' 'router' }}";

export function useRoute() {
  return useContext(RouterContext);
}

export function useParams<T extends keyof ParamsMap>(): ParamsMap[T] {
  return useContext(RouterContext).params as ParamsMap[T];
}
