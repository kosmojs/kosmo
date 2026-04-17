import { compile } from "path-to-regexp";

import { createHost, type HostOpt, join, stringify } from "@kosmojs/core/fetch";

export const pathFactory = <ParamsT extends readonly unknown[]>(
  base: string,
  routeName: string,
  pathPattern: string,
  paramsMap: Array<[name: string, kind: string]>,
  numericParams: Array<string>,
) => {
  const toPath = compile(pathPattern);

  const castParam = (name: string, value: unknown) => {
    if (numericParams.includes(name)) {
      const n = Number(value);
      return Number.isFinite(n) ? n : String(value);
    }
    return String(value);
  };

  const paramsMapper = (params: ParamsT) => {
    return paramsMap.reduce<Record<string, unknown>>((map, [name, kind], i) => {
      if (kind === "splat") {
        if (Array.isArray(params[i]) && params[i].length) {
          map[name] = params[i].map((v) => castParam(name, v));
        }
      } else if (params[i] !== undefined) {
        map[name] = castParam(name, params[i]);
      }
      return map;
    }, {});
  };

  const parametrize = (params: ParamsT) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${routeName}`);
      throw error;
    }
  };

  const path = (params: ParamsT, query?: Record<string, unknown>) => {
    const path = join(base, parametrize(params));
    return query ? [path, stringify(query)].join("?") : path;
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
    path,
    href,
  };
};
