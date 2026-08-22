import { compile, match } from "path-to-regexp";

import {
  type ApiRouteSerialized,
  type PageRouteSerialized,
  stringifySearchParams,
  type ValidationTarget,
} from "@kosmojs/core";
import type { HTTPMethod } from "@kosmojs/core/api";
import { createHost, join } from "@kosmojs/core/fetch";
import type { RoutePathMethods } from "@kosmojs/core/generators";

export const apiRouteMapper = <ParamsT extends readonly unknown[]>(
  base: string,
  { name, pathPattern, params, numericProperties }: ApiRouteSerialized,
): RoutePathMethods<ParamsT> & {
  normalizeParams: (path: string) => Record<string, unknown>;
  normalizeSearchParams: (
    searchParams: Record<string, unknown>,
    method: HTTPMethod,
  ) => Record<string, unknown>;
  payloadResolver: <T>(
    payload: Record<ValidationTarget, T> | undefined,
    target: ValidationTarget,
    method: HTTPMethod,
  ) => T | Record<string, unknown> | undefined;
} => {
  const toPath = compile(pathPattern);
  const pathMatcher = match(join(base, pathPattern));

  const maybeNumber = (val: unknown) => {
    if (val === undefined || val === null) {
      return val;
    }
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  };

  const resolveParam = (path: string, param: (typeof params)[number]) => {
    try {
      const match = pathMatcher(path);
      return match ? match.params[param] : undefined;
    } catch (e) {
      return undefined;
    }
  };

  const normalizeSearchParams = (
    searchParams: Record<string, unknown>,
    method: HTTPMethod,
  ) => {
    return Object.fromEntries(
      Object.entries(searchParams).map(([k, v]) => [
        k,
        numericProperties.query?.[method]?.includes(k)
          ? Array.isArray(v)
            ? v.map((e) => maybeNumber(e))
            : maybeNumber(v)
          : v,
      ]),
    );
  };

  const normalizeParams = (path: string) => {
    return params.reduce((map: Record<string, unknown>, param) => {
      const value = resolveParam(path, param);
      if (Array.isArray(value)) {
        map[param] = numericProperties.params.includes(param)
          ? value.map((e) => maybeNumber(e))
          : value;
      } else if (value) {
        map[param] = numericProperties.params.includes(param)
          ? maybeNumber(value)
          : value;
      }
      return map;
    }, {});
  };

  const paramsMapper: RoutePathMethods<ParamsT>["paramsMapper"] = (
    input,
    opt,
  ) => {
    return params.reduce<Record<string, unknown>>((map, name, i) => {
      const coerceNumbers = opt?.coerceNumbers
        ? numericProperties.params.includes(name)
        : false;
      if (Array.isArray(input[i])) {
        map[name] = coerceNumbers
          ? input[i].map((v) => maybeNumber(v))
          : input[i].map(String);
      } else if (input[i] !== undefined) {
        map[name] = coerceNumbers ? maybeNumber(input[i]) : String(input[i]);
      }
      return map;
    }, {});
  };

  const parametrize: RoutePathMethods<ParamsT>["parametrize"] = (params) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${name}`);
      throw error;
    }
  };

  const path: RoutePathMethods<ParamsT>["path"] = (params, query, opt) => {
    const path = join(
      opt?.prefix === false
        ? "/"
        : typeof opt?.prefix === "string"
          ? opt.prefix
          : base,
      parametrize(params),
    );
    return query //
      ? [path, stringifySearchParams(query)].join("?")
      : path;
  };

  const href: RoutePathMethods<ParamsT>["href"] = (
    host,
    params,
    query,
    opt,
  ) => {
    return createHost(host) + path(params, query, opt);
  };

  const payloadResolver = <T>(
    payload: Record<ValidationTarget, T> | undefined,
    target: ValidationTarget,
    method: HTTPMethod,
  ) => {
    const data = payload?.[target];

    if (target === "query") {
      return Object.fromEntries(
        Object.entries({ ...data }).map(([k, v]) => {
          return [
            k,
            numericProperties.query[method]?.includes(k)
              ? Array.isArray(v)
                ? v.map((v) => maybeNumber(v))
                : maybeNumber(v)
              : v,
          ];
        }),
      );
    }

    if (data instanceof FormData) {
      return [...data].reduce<
        Record<string, FormDataEntryValue | Array<FormDataEntryValue>>
      >((map, [key, val]) => {
        if (key in map) {
          map[key] = [map[key]].flat().concat(val);
        } else {
          map[key] = val;
        }
        return map;
      }, {}) as T;
    }

    return data;
  };

  return {
    normalizeParams,
    normalizeSearchParams,
    payloadResolver,
    paramsMapper,
    parametrize,
    path,
    href,
  };
};

export const pageRouteMapper = <ParamsT extends readonly unknown[]>(
  base: string,
  route: PageRouteSerialized,
): RoutePathMethods<ParamsT> => {
  const toPath = compile(route.pathPattern);

  const paramsMapper: RoutePathMethods<ParamsT>["paramsMapper"] = (params) => {
    return route.params.reduce<Record<string, unknown>>((map, name, i) => {
      if (Array.isArray(params[i])) {
        map[name] = params[i].map(String);
      } else if (params[i] !== undefined) {
        map[name] = String(params[i]);
      }
      return map;
    }, {});
  };

  const parametrize: RoutePathMethods<ParamsT>["parametrize"] = (params) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${route.name}`);
      throw error;
    }
  };

  const path: RoutePathMethods<ParamsT>["path"] = (params, query, opt) => {
    const path = join(
      opt?.prefix === false
        ? "/"
        : typeof opt?.prefix === "string"
          ? opt.prefix
          : base,
      parametrize(params),
    );
    return query //
      ? [path, stringifySearchParams(query)].join("?")
      : path;
  };

  const href: RoutePathMethods<ParamsT>["href"] = (
    host,
    params,
    query,
    opt,
  ) => {
    return createHost(host) + path(params, query, opt);
  };

  return {
    paramsMapper,
    parametrize,
    path,
    href,
  };
};
