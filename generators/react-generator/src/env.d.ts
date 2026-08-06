declare module "{{ createImport 'libCore' }}" {
  import type { PathMapper } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const base: string;
  export const pageRouteMap: ReturnType<PathMapper>;
}

declare module "{{ createImport 'lib' '@ssr/base' }}" {
  import type { AsyncLocalStorage } from "node:async_hooks";
  import type { QueryClient } from "@tanstack/react-query";
  export const store: InstanceType<
    typeof AsyncLocalStorage<{ tsqClient: QueryClient }>
  >;
}

declare module "{{ createImport 'lib' 'app' }}" {
  import type { JSX } from "react";
  export const AppProvider: (o: { children: JSX.Element }) => JSX.Element;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { JSX, ComponentType } from "react";
  import type { RouteObject } from "react-router";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { createRouterFactory } from "@kosmojs/core/generators";

  export const createRouters: (
    routes: Array<RouteObject>,
    assets: { app: ComponentType },
  ) => {
    clientRouter: () => RouterFactoryReturn<Promise<JSX.Element>>;
    serverRouter: (url: URL) => RouterFactoryReturn<Promise<JSX.Element>>;
  }

  export default createRouterFactory<RouteObject, Promise<JSX.Element>>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import type { JSX } from "react";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { clientRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: (opt?: { withPreload?: boolean }) => [];

  export const hydrate: (
    r: () => RouterFactoryReturn<Promise<JSX.Element>>,
    e: HTMLElement,
  ) => Promise<void>;

  export const mount: (
    r: () => RouterFactoryReturn<Promise<JSX.Element>>,
    e: HTMLElement,
  ) => Promise<void>;

  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { JSX } from "react";

  import type {
    renderToString as renderToStringOrig,
    renderToReadableStream,
  } from "react-dom/server";

  import type {
    RenderToStringWrapper,
    RenderToStreamWrapper,
    RouterFactoryReturn,
  } from "@kosmojs/core";

  import { serverRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: (o?: { withPreload?: boolean }) => [];

  export const renderToString: RenderToStringWrapper<
    () => RouterFactoryReturn<Promise<JSX.Element>>,
    Parameters<renderToStringOrig>[1]
  >;

  export const renderToStream: RenderToStreamWrapper<
    () => RouterFactoryReturn<Promise<JSX.Element>>,
    Parameters<renderToReadableStream>[1]
  >;

  export default serverRenderFactory();
}

declare module "{{ createImport 'lib' 'pageSamples/404.tsx' }}" {
  import type { ComponentType } from "react";
  const component: ComponentType;
  export default component;
}
