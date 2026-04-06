declare module "#templates/*" {
  const src: string;
  export default src;
}

declare module "{{ createImport 'config' }}" {
  export const baseurl: string;
}

declare module "{{ createImport 'lib' 'unwrap' }}" {
  export const unwrap: Function;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { JSX } from "solid-js";
  import type { RouteDefinition } from "@solidjs/router";
  import { createRouterFactory, type PageLink } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const linkMap: Record<string, PageLink>;
  export default createRouterFactory<RouteDefinition, JSX.Element>();
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
  import type { Component } from "solid-js";
  const component: Component;
  export default component;
}
