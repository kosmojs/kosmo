declare module "{{ createImport 'libCore' }}" {
  import type { PathMapper } from "@kosmojs/core/generators";
  export type LinkProps = [""];
  export const base: string;
  export const pageRouteMap: ReturnType<PathMapper>;
}

declare module "{{ createImport 'lib' 'mdx' }}" {
  export * from "#/templates/lib/mdx";
}

declare module "{{ createImport 'lib' 'params' }}" {
  export type ParamsMap = Record<string, object>;
  export const paramNames: Record<string, Array<string>>;
}

declare module "{{ createImport 'lib' 'router' }}" {
  import type { ComponentType } from "preact";
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { createRouterFactory } from "@kosmojs/core/generators";
  import type { RawRoute, ResolvedRoute } from "#/templates/lib/mdx";

  export const createRouters: (
    routes: Array<RawRoute>,
    assets: { app: ComponentType; components: Record<string, ComponentType<never>> },
  ) => {
    clientRouter: () => RouterFactoryReturn<
      Promise<ResolvedRoute["component"]>,
      ResolvedRoute
    >;
    serverRouter: (url: URL) => RouterFactoryReturn<
      Promise<ResolvedRoute["component"]>,
      ResolvedRoute
    >;
  }

  export default createRouterFactory<
    RawRoute,
    Promise<ResolvedRoute["component"]>,
    { client: ResolvedRoute, server: ResolvedRoute }
  >();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import type { RouterFactoryReturn } from "@kosmojs/core";
  import { clientRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute, ResolvedRoute } from "#/templates/lib/mdx";

  export const createRoutes: () => Array<RawRoute>;

  export const hydrate: (
    r: () => RouterFactoryReturn<Promise<ResolvedRoute["component"]>>,
    e: HTMLElement,
  ) => Promise<void>;

  export const mount: (
    r: () => RouterFactoryReturn<Promise<ResolvedRoute["component"]>>,
    e: HTMLElement,
  ) => Promise<void>;

  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { RenderToStringWrapper, RouterFactoryReturn } from "@kosmojs/core";
  import { serverRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute, ResolvedRoute } from "#/templates/lib/mdx";

  export const createRoutes: () => Array<RawRoute>;

  export const renderToString: RenderToStringWrapper<
    () => RouterFactoryReturn<Promise<ResolvedRoute["component"]>>
  >;

  export default serverRenderFactory<false>();
}

declare module "{{ createImport 'lib' 'pageSamples/404.tsx' }}" {
  import type { ComponentType } from "preact";
  const component: ComponentType;
  export default component;
}

declare module "{{ createImport 'pages' '404.mdx' }}" {
  import type { ComponentType } from "preact";
  const component: ComponentType;
  export const frontmatter = Record<string, unknown>;
  export default component;
}

declare module "{{ createImport 'lib' 'ssg:routes' }}" {
  import type { PageRoute } from "@kosmojs/core";
  const modules: Record<
    string,
    {
      frontmatter?: { staticParams?: Array<Array<string | Array<string>>> };
      pathPattern: string;
      params: PageRoute["params"];
    }
  >;
  export default modules;
}
