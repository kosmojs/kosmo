import { useContext } from "preact/hooks";

import { RouterContext } from "./mdx";

import type { ParamsMap, paramNames } from "{{ createImport 'lib' 'params' }}";

export function useRoute() {
  return useContext(RouterContext);
}

export function useParams<T extends keyof ParamsMap>(): ParamsMap[T] {
  return useContext(RouterContext).params as ParamsMap[T];
}

type SameLengthTuple<T extends readonly unknown[], U> = { [K in keyof T]: U };

export function useParamsEntries<T extends keyof ParamsMap>(): [
  (typeof paramNames)[T],
  SameLengthTuple<(typeof paramNames)[T], unknown>,
] {
  return useContext(RouterContext).paramsEntries;
}
