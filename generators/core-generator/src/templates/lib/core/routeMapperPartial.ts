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
  const { name, pathPattern, numericProperties } = route;

  const toPath = compile(join(base, pathPattern));

  const paramsMapper: RoutePathMethods<ParamsT>["paramsMapper"] = (
    params,
    opt,
  ) => {
    return Array.isArray(params)
      ? Object.fromEntries(
          route.params.flatMap((name, i) => {
            const coerceNumbers = opt?.coerceNumbers
              ? numericProperties.params.includes(name)
              : false;
            if (Array.isArray(params[i])) {
              return [
                [
                  name,
                  coerceNumbers
                    ? params[i].map((v) => maybeNumber(v))
                    : params[i].map(String),
                ],
              ];
            }
            if (params[i] !== undefined) {
              return [
                [
                  name,
                  coerceNumbers //
                    ? maybeNumber(params[i])
                    : String(params[i]),
                ],
              ];
            }
            return [];
          }),
        )
      : {};
  };

  const parametrize: RoutePathMethods<ParamsT>["parametrize"] = (params) => {
    const paramsMap = paramsMapper(params as never);
    try {
      return toPath(paramsMap as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${name}`);
      throw error;
    }
  };

  const path = ((
    params?: ParamsT,
    query?: Record<string, unknown>,
    opt?: { prefix?: boolean | string },
  ) => {
    const path = join(
      opt?.prefix === false
        ? "/"
        : typeof opt?.prefix === "string"
          ? opt.prefix
          : base,
      parametrize(params as ParamsT),
    );
    return query ? [path, stringifySearchParams(query)].join("?") : path;
  }) as RoutePathMethods<ParamsT>["path"];

  const href = ((host, params, query, opt) => {
    return createHost(host) + path(params, query, opt);
  }) as RoutePathMethods<ParamsT>["href"];

  return { ...route, paramsMapper, parametrize, path, href };
};

export const pageRouteMapper = <ParamsT extends readonly unknown[]>(
  base: string,
  route: PageRouteSerialized,
): PageRouteSerialized & RoutePathMethods<ParamsT> => {
  const toPath = compile(join(base, route.pathPattern));

  const paramsMapper: RoutePathMethods<ParamsT>["paramsMapper"] = (params) => {
    return Array.isArray(params)
      ? Object.fromEntries(
          route.params.flatMap<[string, string | Array<string>]>((name, i) => {
            if (Array.isArray(params[i])) {
              return [[name, params[i].map(String)]];
            }
            if (params[i] !== undefined) {
              return [[name, String(params[i])]];
            }
            return [];
          }),
        )
      : {};
  };

  const parametrize: RoutePathMethods<ParamsT>["parametrize"] = (params) => {
    const paramsMap = paramsMapper(params as never);
    try {
      return toPath(paramsMap as never);
    } catch (error) {
      console.error(`❗ERROR: Failed building path for ${route.name}`);
      throw error;
    }
  };

  const path = ((params, query, opt) => {
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
  }) as RoutePathMethods<ParamsT>["path"];

  const href = ((host, params, query, opt) => {
    return createHost(host) + path(params, query, opt);
  }) as RoutePathMethods<ParamsT>["href"];

  return { ...route, paramsMapper, parametrize, path, href };
};
