import { compile } from "path-to-regexp";

import type { PathMapperSignature } from "@kosmojs/core";
import { createHost, join, stringify } from "@kosmojs/core/fetch";

export const pathMapper = <ParamsT extends readonly unknown[]>(
  basePath: string,
  routeName: string,
  pathPattern: string,
  paramsMap: Array<[name: string, kind: string]>,
  numericParams: Array<string>,
): PathMapperSignature<ParamsT> => {
  const toPath = compile(pathPattern);

  const castParam = (name: string, value: unknown) => {
    if (numericParams.includes(name)) {
      const n = Number(value);
      return Number.isFinite(n) ? n : String(value);
    }
    return String(value);
  };

  const paramsMapper: PathMapperSignature<ParamsT>["paramsMapper"] = (
    params,
  ) => {
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

  const parametrize: PathMapperSignature<ParamsT>["parametrize"] = (params) => {
    try {
      return toPath(paramsMapper(params) as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${routeName}`);
      throw error;
    }
  };

  const base: PathMapperSignature<ParamsT>["base"] = (params, query) => {
    const path = join("/", parametrize(params));
    return query ? [path, stringify(query)].join("?") : path;
  };

  const path: PathMapperSignature<ParamsT>["path"] = (params, query) => {
    return join(basePath, base(params, query));
  };

  const href: PathMapperSignature<ParamsT>["href"] = (host, params, query) => {
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
