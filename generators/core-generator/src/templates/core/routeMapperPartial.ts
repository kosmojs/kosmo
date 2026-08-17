import { compile, match } from "path-to-regexp";

import {
  type ApiRouteSerialized,
  type PageRouteSerialized,
  stringifySearchParams,
  type ValidationTarget,
} from "@kosmojs/core";
import type { HTTPMethod } from "@kosmojs/core/api";
import { createHost, type HostOpt, join } from "@kosmojs/core/fetch";

export const apiRouteMapper = <ParamsT extends readonly unknown[]>(
  basePath: string,
  { name, pathPattern, params, numericProperties }: ApiRouteSerialized,
) => {
  const toPath = compile(pathPattern);
  const pathMatcher = match(join(basePath, pathPattern));

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

  const paramsMapper = (input: ParamsT, opt?: { coerceNumbers?: boolean }) => {
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

  const parametrize = (params: ParamsT) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${name}`);
      throw error;
    }
  };

  const base = (params: ParamsT, query?: Record<string, unknown>) => {
    const path = join("/", parametrize(params));
    return query ? [path, stringifySearchParams(query)].join("?") : path;
  };

  const path = (params: ParamsT, query?: Record<string, unknown>) => {
    return join(basePath, base(params, query));
  };

  const href = (
    host: HostOpt,
    params: ParamsT,
    query?: Record<string, unknown>,
  ) => {
    return createHost(host) + path(params, query);
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
    paramsMapper,
    parametrize,
    base,
    path,
    href,
    payloadResolver,
  };
};

export const pageRouteMapper = <ParamsT extends readonly unknown[]>(
  basePath: string,
  route: PageRouteSerialized,
) => {
  const toPath = compile(route.pathPattern);

  const paramsMapper = (params: ParamsT) => {
    return route.params.reduce<Record<string, unknown>>((map, name, i) => {
      if (Array.isArray(params[i])) {
        map[name] = params[i].map(String);
      } else if (params[i] !== undefined) {
        map[name] = String(params[i]);
      }
      return map;
    }, {});
  };

  const parametrize = (params: ParamsT) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${route.name}`);
      throw error;
    }
  };

  const base = (params: ParamsT, query?: Record<string, unknown>) => {
    const path = join("/", parametrize(params));
    return query ? [path, stringifySearchParams(query)].join("?") : path;
  };

  const path = (params: ParamsT, query?: Record<string, unknown>) => {
    return join(basePath, base(params, query));
  };

  const href = (
    host: HostOpt,
    params: ParamsT,
    query?: Record<string, unknown>,
  ) => {
    return createHost(host) + path(params, query);
  };

  return {
    paramsMapper,
    parametrize,
    base,
    path,
    href,
  };
};
