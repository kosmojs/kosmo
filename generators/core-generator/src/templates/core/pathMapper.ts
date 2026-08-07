import { compile } from "path-to-regexp";

import type { PathMapperSignature } from "@kosmojs/core";
import type { RouteSource } from "@kosmojs/core/api";
import { createHost, join, stringify } from "@kosmojs/core/fetch";

export const pathMapper = <ParamsT extends readonly unknown[]>(
  basePath: string,
  routeName: string,
  pathPattern: string,
  paramsMap: RouteSource<never>["params"],
): PathMapperSignature<ParamsT> => {
  const toPath = compile(pathPattern);

  const castParam = (value: unknown, coerceNumbers: boolean | undefined) => {
    if (coerceNumbers) {
      const n = Number(value);
      return Number.isFinite(n) ? n : String(value);
    }
    return String(value);
  };

  const paramsMapper: PathMapperSignature<ParamsT>["paramsMapper"] = (
    params,
    opt?: { coerceNumbers?: boolean },
  ) => {
    return paramsMap.reduce<Record<string, unknown>>(
      (map, { name, type }, i) => {
        if (Array.isArray(params[i])) {
          map[name] = params[i].map((v) => {
            return castParam(v, opt?.coerceNumbers ? type === "number" : false);
          });
        } else if (params[i] !== undefined) {
          map[name] = castParam(
            params[i],
            opt?.coerceNumbers ? type === "number" : false,
          );
        }
        return map;
      },
      {},
    );
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
