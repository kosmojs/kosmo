import type { HostOpt } from "../fetch";
import type {
  ApiRoute,
  ApiRouteSerialized,
  CSRFactory,
  PageRoute,
  PageRouteSerialized,
  RouterFactoryReturn,
  SSRFactory,
} from "../types";

export const routeRenderHelpers = () => {
  return {
    serializeApiRoute({
      name,
      pathPattern,
      params,
      validationDefinitions,
    }: ApiRoute) {
      return JSON.stringify({
        name,
        pathPattern,
        params: params.schema.map((e) => e.name),
        numericProperties: {
          params: params.schema.flatMap(({ name }) => {
            return params.resolvedType?.numericProperties?.includes(name)
              ? [name]
              : [];
          }),
          query: validationDefinitions.reduce<
            ApiRouteSerialized["numericProperties"]["query"]
          >((map, e) => {
            if (e.target === "query") {
              map[e.method] = e.schema.resolvedType?.numericProperties || [];
            }
            return map;
          }, {}),
        },
        booleanProperties: {
          query: validationDefinitions.reduce<
            ApiRouteSerialized["booleanProperties"]["query"]
          >((map, e) => {
            if (e.target === "query") {
              map[e.method] = e.schema.resolvedType?.booleanProperties || [];
            }
            return map;
          }, {}),
        },
      } satisfies ApiRouteSerialized);
    },

    serializePageRoute({ name, pathPattern, params }: PageRoute) {
      return JSON.stringify({
        name,
        pathPattern,
        params: params.schema.map((e) => e.name),
      } satisfies PageRouteSerialized);
    },

    serializeParamsTupleElements: (route: PageRoute) => {
      return route.params.schema
        .map((p, i) => {
          if (p.kind === "splat") {
            // optional unless a required param follows,
            // which a tuple cannot place after an optional element
            const requiredAfter = route.params.schema
              .slice(i + 1)
              .some((e) => e.kind === "required");
            const suffix = requiredAfter ? "" : "?";
            return `${p.const + suffix}: Array<string | number>`;
          }
          return p.kind === "optional"
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

export const createRouterFactory = <
  RouteT,
  ComponentT,
  OptionsT extends {
    client?: Record<string, unknown>;
    server?: Record<string, unknown>;
  } = {},
  ClientReturnT = RouterFactoryReturn<
    ComponentT,
    OptionsT extends { client: object } ? OptionsT["client"] : {}
  >,
  ServerReturnT = RouterFactoryReturn<
    ComponentT,
    OptionsT extends { server: object } ? OptionsT["server"] : {}
  >,
>() => {
  return (
    factory: (routes: Array<RouteT>) => {
      clientRouter: () => ClientReturnT;
      serverRouter: (url: URL) => ServerReturnT;
    },
  ) => factory;
};

export const serverRenderFactory: <
  StreamImplementationRequired extends boolean = true,
>() => SSRFactory<StreamImplementationRequired> = () => {
  return (factory) => factory();
};

export const clientRenderFactory: () => CSRFactory = () => {
  return async (factory) => {
    const methods = factory();
    if (window.__KOSMO_HYDRATION_BOOL__) {
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

/**
 * Arguments of `path`, and of `href` after the host.
 * Params may be omitted when an empty tuple fits ParamsT,
 * that is when every param is optional: a route without params,
 * or one whose params are all optional or splats with nothing required after them.
 *
 * One signature rather than overloads: a route map indexed by a union of keys
 * yields a union of these functions, and TypeScript cannot call a union
 * whose members carry overloads that differ.
 * */
export type RoutePathArgs<ParamsT extends readonly unknown[]> =
  [] extends ParamsT
    ? [
        params?: ParamsT,
        query?: Record<string, unknown>,
        opt?: { prefix?: boolean | string },
      ]
    : [
        params: ParamsT,
        query?: Record<string, unknown>,
        opt?: { prefix?: boolean | string },
      ];

export type RoutePathMethods<ParamsT extends readonly unknown[]> = {
  paramsMapper: (
    params: ParamsT,
    opt?: { coerceNumbers?: boolean },
  ) => Record<string, unknown>;

  parametrize: (params: ParamsT) => string;

  path: (...args: RoutePathArgs<ParamsT>) => string;

  href: (host: HostOpt, ...args: RoutePathArgs<ParamsT>) => string;
};
