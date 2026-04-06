import { compile } from "path-to-regexp";

import { createHost, join, stringify } from "../fetch";
import type {
  CSRFactory,
  MappedPageRouteSignature,
  MappedPageRouteSource,
  PageRoute,
  SSRFactory,
} from "../types";

export const pageRouteMapperHelpers = () => {
  return {
    serializeRoute({ name, pathPattern, honoPattern, params }: PageRoute) {
      return JSON.stringify({
        name,
        pathPattern,
        honoPattern,
        params,
      });
    },
    serializeParamsTupleElements: (route: PageRoute) => {
      return route.params.schema
        .map((p) => {
          return p.kind === "splat"
            ? `${p.const}?: Array<string | number>`
            : p.kind === "optional"
              ? `${p.const}?: string | number`
              : `${p.const}: string | number`;
        })
        .join(", ");
    },
    serializeParamsLiteral(route: PageRoute) {
      const elements = route.params.schema.map((e) => {
        return [
          [e.name, e.kind === "required" ? "" : "?"].join(""),
          e.kind === "splat" ? "Array<string>" : "string",
        ].join(": ");
      });
      return `{ ${elements.join("; ")} }`;
    },
  };
};

export function pageRouteMapper<
  ParamsT extends Array<unknown>,
  ExtendT extends object = {},
>(
  route: MappedPageRouteSource,
  options: { baseurl: string } & ExtendT,
): MappedPageRouteSignature<ParamsT, ExtendT> {
  const { baseurl, ...extend } = options;

  const toPath = compile(route.pathPattern);

  const paramsMapper = (value: Array<unknown>) => {
    return route.params.schema.reduce<Record<string, unknown>>(
      (map, { name, kind }, i) => {
        if (kind === "splat") {
          if (Array.isArray(value[i]) && value[i].length) {
            map[name] = value[i].map(String);
          }
        } else if (value[i] !== undefined) {
          map[name] = String(value[i]);
        }
        return map;
      },
      {},
    );
  };

  return {
    ...extend,
    ...route,

    parametrize(params) {
      try {
        return toPath(paramsMapper(params) as never);
      } catch (
        // biome-ignore lint: any
        error: any
      ) {
        console.error(`❗ERROR: Failed building path for ${route.name}`);
        console.error(error);
        return "";
      }
    },

    base(params, query) {
      const base = join("/", this.parametrize(params));
      return query ? [base, stringify(query)].join("?") : base;
    },

    path(params, query) {
      return join(baseurl, this.base(params, query));
    },

    href(host, params, query) {
      return createHost(host) + this.path(params, query);
    },
  } as MappedPageRouteSignature<ParamsT, ExtendT>;
}

export const createRouterFactory = <RouteT, ReturnT>() => {
  return (
    factory: (routes: Array<RouteT>) => {
      clientRouter: (url?: URL) => Promise<ReturnT>;
      serverRouter: (url: URL) => Promise<ReturnT>;
    },
  ) => factory;
};

export const serverRenderFactory: () => SSRFactory = () => {
  return (factory) => factory();
};

export const clientRenderFactory: () => CSRFactory = () => {
  return async (factory) => {
    const methods = factory();
    if (import.meta.env.SSR) {
      if (typeof methods.hydrate === "function") {
        await methods.hydrate();
      } else {
        console.error("❌ `hydrate` method is required in entry/client");
      }
    } else {
      if (typeof methods.mount === "function") {
        await methods.mount();
      } else {
        console.error("❌ `mount` method is required in entry/client");
      }
    }
  };
};
