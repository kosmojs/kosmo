import { compile } from "path-to-regexp";

import type { PageRoute } from "@kosmojs/dev";
import { createHost, type HostOpt, join, stringify } from "@kosmojs/fetch";

import { baseurl } from "{{ createImport 'config' }}";

export const ssrMode = () => {
  ssrMode;
};

type QueryT = Record<string, unknown>;

export const pagePathFactory = <ParamsT extends Array<unknown>>(
  route: Pick<PageRoute, "name" | "pathPattern" | "params">,
) => {
  const toPath = compile(route.pathPattern);

  const paramsMapper = (params: ParamsT) => {
    return route.params.schema.reduce<Record<string, unknown>>(
      (map, { name, kind }, i) => {
        if (kind === "splat") {
          if (Array.isArray(params[i]) && params[i].length) {
            map[name] = params[i].map(String);
          }
        } else if (params[i] !== undefined) {
          map[name] = String(params[i]);
        }
        return map;
      },
      {},
    );
  };

  return {
    parametrize(params: ParamsT) {
      try {
        return toPath(paramsMapper(params) as never);
      } catch (error: any) {
        console.error(`❗ERROR: Failed building path for ${route.name}`);
        console.error(error);
        return "";
      }
    },

    base(params: ParamsT, query?: QueryT) {
      const base = join("/", this.parametrize(params));
      return query ? [base, stringify(query)].join("?") : base;
    },

    path(params: ParamsT, query?: QueryT) {
      return join(baseurl, this.base(params, query));
    },

    href(host: HostOpt, params: ParamsT, query?: QueryT) {
      return createHost(host) + this.path(params, query);
    },
  };
};
