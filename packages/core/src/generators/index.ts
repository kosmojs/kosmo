import type { CSRFactory, PageRoute, SSRFactory } from "../types";

export const routeRenderHelpers = () => {
  return {
    pageLinkBase({ name, pathPattern, params }: PageRoute) {
      return JSON.stringify({
        name,
        pathPattern,
        params,
      } satisfies Pick<PageRoute, "name" | "pathPattern" | "params">);
    },
    serializeParamsTupleElements: (route: PageRoute) => {
      return route.params.schema
        .map((p, i) => {
          if (p.kind === "splat") {
            // mark it as optional only if it is last param
            const suffix = route.params.schema[i + 1] ? "" : "?";
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

export const clientRenderFactory: (ssr: boolean) => CSRFactory = (ssr) => {
  return async (factory) => {
    const methods = factory();
    if (ssr) {
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
