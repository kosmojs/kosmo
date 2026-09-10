import { compile } from "path-to-regexp";

import {
  type ApiRouteSerialized,
  maybeNumber,
  type PageRouteSerialized,
  stringifySearchParams,
} from "@kosmojs/core";
import { createHost, join } from "@kosmojs/core/fetch";
import type { RoutePathMethods } from "@kosmojs/core/generators";

export const apiRouteMapper = <ParamsT extends readonly unknown[]>(
  base: string,
  route: ApiRouteSerialized,
): ApiRouteSerialized & RoutePathMethods<ParamsT> => {
  const { name, pathPattern, params, numericProperties } = route;

  const toPath = compile(join(base, pathPattern));

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

  return { ...route, paramsMapper, parametrize, path, href };
};

export const pageRouteMapper = <ParamsT extends readonly unknown[]>(
  base: string,
  route: PageRouteSerialized,
): PageRouteSerialized & RoutePathMethods<ParamsT> => {
  const toPath = compile(join(base, route.pathPattern));

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

  return { ...route, paramsMapper, parametrize, path, href };
};
