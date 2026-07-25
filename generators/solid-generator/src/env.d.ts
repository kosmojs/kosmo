declare module "{{ createImport 'libCore' }}" {
  import type { PathMapper } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const base: string;
  export const pageRouteMap: ReturnType<PathMapper>;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { JSX, ParentComponent } from "solid-js";
  import type { RouteDefinition } from "@solidjs/router";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { createRouterFactory } from "@kosmojs/core/generators";

  export const createRouters: (
    routes: Array<RouteDefinition>,
    assets: { app: ParentComponent, url?: URL },
  ) => {
    clientRouter: () => RouterFactoryReturn<JSX.Element>;
    serverRouter: (url: URL) => RouterFactoryReturn<JSX.Element>;
  }

  export default createRouterFactory<RouteDefinition, JSX.Element>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import type { JSX } from "solid-js";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { clientRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: (opt?: { withPreload?: boolean }) => [];

  export const hydrate: (
    r: () => RouterFactoryReturn<JSX.Element>,
    e: HTMLElement,
  ) => Promise<void>;

  export const mount: (
    r: () => RouterFactoryReturn<JSX.Element>,
    e: HTMLElement,
  ) => Promise<void>;

  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { JSX } from "solid-js";

  import type {
    renderToStringAsync,
    renderToStream as renderToStreamOrig,
  } from "solid-js/web";

  import type {
    RenderToStringWrapper,
    RenderToStreamWrapper,
    RouterFactoryReturn,
  } from "@kosmojs/core";

  import { serverRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: (opt?: { withPreload?: boolean }) => [];

  export const renderToString: RenderToStringWrapper<
    () => RouterFactoryReturn<JSX.Element>,
    Parameters<renderToStringAsync>[1]
  >;

  export const renderToStream: RenderToStreamWrapper<
    () => RouterFactoryReturn<JSX.Element>,
    Parameters<renderToStreamOrig>[1]
  >;

  export default serverRenderFactory();
}

declare module "{{ createImport 'lib' 'pageSamples/404.tsx' }}" {
  import type { Component } from "solid-js";
  const component: Component;
  export default component;
}
