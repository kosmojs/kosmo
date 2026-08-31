declare module "{{ createImport 'libCore' }}" {
  import type { RoutePathMethods } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const base: string;
  export const pageRouteMap: Record<string, RoutePathMethods<[]>>;
}

declare module "{{ createImport 'lib' 'app' }}" {
  import type { Component } from "svelte";
  export const AppProvider: Component;
}

declare module "{{ createImport 'lib' 'params' }}" {
  export type ParamsMap = Record<string, object>;
  export const paramNames: Record<string, Array<string>>;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { createRouterFactory } from "@kosmojs/core/generators";
  import type {
    AnyComponent,
    RawRoute,
    Route,
    RouteComponent,
  } from "#/templates/lib/svelte";

  export const createRouters: (
    routes: Array<RawRoute>,
    assets: { app: AnyComponent },
  ) => {
    clientRouter: () => RouterFactoryReturn<Promise<RouteComponent>>;
    serverRouter: (url: URL) => RouterFactoryReturn<Promise<RouteComponent>, {
      route: Route,
    }>;
  }

  export default createRouterFactory<
    RawRoute,
    Promise<RouteComponent>,
    { server: { route: Route } }
  >();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { clientRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute, RouteComponent } from "#/templates/lib/svelte";

  export const createRoutes: () => Array<RawRoute>;

  export const hydrate: (
    r: () => RouterFactoryReturn<Promise<RouteComponent>>,
    e: HTMLElement,
  ) => Promise<void>;

  export const mount: (
    r: () => RouterFactoryReturn<Promise<RouteComponent>>,
    e: HTMLElement,
  ) => Promise<void>;

  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { RenderToStringWrapper, RouterFactoryReturn } from "@kosmojs/core";
  import { serverRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute, Route, RouteComponent } from "#/templates/lib/svelte";

  export const createRoutes: () => Array<RawRoute>;

  export const renderToString: RenderToStringWrapper<
    () => RouterFactoryReturn<Promise<RouteComponent>, { route: Route }>
  >;

  export default serverRenderFactory<false>();
}

declare module "{{ createImport 'lib' 'pageSamples/404.svelte' }}" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}

declare module "{{ createImport 'pages' '404.svelte' }}" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}
