import { match } from "path-to-regexp";

import { maybeBoolean, maybeNumber } from "../generic";
import type { RouteSource } from "./types";

export const createParamsNormalizers = <T>(routeSource: RouteSource<T>) => {
  const { name, numericProperties, booleanProperties } = routeSource;

  const pathMatcher = match(routeSource.pathPattern);

  const resolveParams = (path: string) => {
    try {
      const match = pathMatcher(path);
      return match ? match.params : undefined;
      // biome-ignore lint: any
    } catch (error: any) {
      console.error(
        `Failed resolving ${name} params; path: ${path}; error: ${error.message}`,
      );
      return undefined;
    }
  };

  return {
    /**
     * Normalize URL params:
     * - Splat params (e.g. `/files{/*path}`) are split into arrays by "/"
     * - Numeric params are cast to Number (or array of Numbers for splat params)
     * - Non-splat, non-numeric params pass through as strings
     * */
    normalizeParams: (path: string) => {
      const params = resolveParams(path);
      return Object.fromEntries(
        routeSource.params.map((param) => {
          const value = params?.[param];

          if (Array.isArray(value)) {
            return [
              param,
              numericProperties.params.includes(param)
                ? value.map((e) => maybeNumber(e))
                : value,
            ];
          }

          if (value) {
            return [
              param,
              numericProperties.params.includes(param)
                ? maybeNumber(value)
                : value,
            ];
          }

          // WARN: exclude param if no value;
          // typebox's exactOptionalPropertyTypes option is enabled explicitly,
          // which means validation will fail for optional params with an undefined value.
          return [];
        }),
      );
    },

    /**
     * Normalize search params:
     * - Numeric params are cast to Number
     * - Boolean params are cast to true/false
     * - Everything else left as is
     * */
    normalizeSearchParams: (
      searchParams: Record<string, unknown>,
      _method: string,
    ) => {
      const method = _method === "HEAD" ? "GET" : _method;
      return Object.fromEntries(
        Object.entries(searchParams).map(([k, v]) => {
          if (numericProperties.query?.[method]?.includes(k)) {
            return [
              k,
              Array.isArray(v) ? v.map((e) => maybeNumber(e)) : maybeNumber(v),
            ];
          }
          if (booleanProperties.query?.[method]?.includes(k)) {
            return [
              k,
              Array.isArray(v)
                ? v.map((e) => maybeBoolean(e))
                : maybeBoolean(v),
            ];
          }
          return [k, v];
        }),
      );
    },
  };
};
