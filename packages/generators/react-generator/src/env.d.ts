declare module "*.hbs" {
  const src: string;
  export default src;
}

declare module "*?as=text" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'config' }}" {
  export const baseurl: string;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { ComponentType, PropsWithChildren, JSX } from "react";
  import type { RouteObject } from "react-router";
  import {
    createRouterFactory,
    type MappedPageRouteSignature,
  } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const routeMap: Record<string, MappedPageRouteSignature>;
  export const routerFactory = createRouterFactory<{
    app: ComponentType<PropsWithChildren>;
    router: JSX.Element;
    route: RouteObject;
  }>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import { clientRenderFactory } from "@kosmojs/core/generators";
  export const createRoutes: (opt?: { withPreload?: boolean }) => [];
  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import { serverRenderFactory } from "@kosmojs/core/generators";
  export const createRoutes: (opt?: { withPreload?: boolean }) => [];
  export default serverRenderFactory();
}

declare module "{{ createImport 'lib' 'pageSamples/404.tsx' }}" {
  import type { ComponentType } from "react";
  const component: ComponentType;
  export default component;
}
