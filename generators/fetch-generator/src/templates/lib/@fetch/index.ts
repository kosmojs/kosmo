import { compile } from "path-to-regexp";

import type { ApiRouteSerialized, ValidationTarget } from "@kosmojs/core";
import type { HTTPMethod } from "@kosmojs/core/api";
import { createHost, type HostOpt, join, stringify } from "@kosmojs/core/fetch";

export * from "./transport";

export const fetchHelpers = <ParamsT extends readonly unknown[]>(
  basePath: string,
  route: ApiRouteSerialized,
) => {
  const toPath = compile(route.pathPattern);

  const maybeNumber = (val: unknown) => {
    if (val === undefined || val === null) {
      return val;
    }
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  };

  const paramsMapper = (params: ParamsT, opt?: { coerceNumbers?: boolean }) => {
    return route.params.reduce<Record<string, unknown>>((map, name, i) => {
      const coerceNumbers = opt?.coerceNumbers
        ? route.numericProperties.params.includes(name)
        : false;
      if (Array.isArray(params[i])) {
        map[name] = coerceNumbers
          ? params[i].map((v) => maybeNumber(v))
          : params[i].map(String);
      } else if (params[i] !== undefined) {
        map[name] = coerceNumbers ? maybeNumber(params[i]) : String(params[i]);
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
    return query ? [path, stringify(query)].join("?") : path;
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
            route.numericProperties.query[method]?.includes(k)
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
    paramsMapper,
    parametrize,
    base,
    path,
    href,
    payloadResolver,
  };
};
