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
  import type { App } from "vue";
  import type { RouteRecordRaw } from "vue-router";
  import { createRouterFactory, type PageLink } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const linkMap: Record<string, PageLink>;
  export default createRouterFactory<RouteRecordRaw, App>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import { clientRenderFactory } from "@kosmojs/core/generators";
  export const createRoutes: () => [];
  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import { serverRenderFactory } from "@kosmojs/core/generators";
  export const createRoutes: () => [];
  export default serverRenderFactory();
}

declare module "{{ createImport 'lib' 'pageSamples/404.vue' }}" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}
