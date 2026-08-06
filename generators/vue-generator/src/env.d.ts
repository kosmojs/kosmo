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
  import type { Plugin } from "vue";
  export const appProvider: Plugin;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { App, Component, Plugin } from "vue";
  import type { RouteRecordRaw } from "vue-router";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { createRouterFactory } from "@kosmojs/core/generators";

  export const createRouters: (
    routes: Array<RouteRecordRaw>,
    assets: {
      app: Component;
      use?: Array<[plugin: Plugin, options: object | undefined]>;
    },
  ) => {
    clientRouter: () => RouterFactoryReturn<Promise<App>>;
    serverRouter: (url: URL) => RouterFactoryReturn<Promise<App>, {
      loaderData: Record<string, unknown>
    }>;
  }

  export default createRouterFactory<RouteRecordRaw, Promise<App>, {
    server: { loaderData: Record<string, unknown> }
  }>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import type { App } from "vue";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { clientRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: () => [];

  export const hydrate: (
    r: () => RouterFactoryReturn<Promise<App>>,
    e: HTMLElement,
  ) => Promise<void>;

  export const mount: (
    r: () => RouterFactoryReturn<Promise<App>>,
    e: HTMLElement,
  ) => Promise<void>;

  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { App } from "vue";

  import type {
    renderToString as renderToStringOrig,
    renderToWebStream,
  } from "vue/server-renderer";

  import type {
    RenderToStringWrapper,
    RenderToStreamWrapper,
    RouterFactoryReturn,
  } from "@kosmojs/core";

  import { serverRenderFactory } from "@kosmojs/core/generators";

  export const createRoutes: () => [];

  export const renderToString: RenderToStringWrapper<
    () => RouterFactoryReturn<Promise<App>>,
    Parameters<renderToStringOrig>[1]
  >;

  export const renderToStream: RenderToStreamWrapper<
    () => RouterFactoryReturn<Promise<App>>,
    Parameters<renderToWebStream>[1]
  >;

  export default serverRenderFactory();
}

declare module "{{ createImport 'lib' 'pageSamples/404.vue' }}" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}
