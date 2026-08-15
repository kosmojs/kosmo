import { compile } from "path-to-regexp";

import { type PageRouteSerialized, stringifySearchParams } from "@kosmojs/core";
import { createHost, type HostOpt, join } from "@kosmojs/core/fetch";

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
