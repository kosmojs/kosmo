declare module "#templates/*" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'config' }}" {
  export const baseurl: string;
}

declare module "{{ createImport 'lib' 'mdx' }}" {
  export * from "#templates/lib/mdx.ts";
}

declare module "{{ createImport 'lib' 'router' }}" {
  import { createRouterFactory, type PageLink } from "@kosmojs/core/generators";
  import type { RawRoute, RouterInstance } from "#templates/lib/mdx.ts";
  export type ParamsMap = Record<string, object>;
  export type LinkProps = [""];
  export const linkMap: Record<string, PageLink>;
  export default createRouterFactory<RawRoute, RouterInstance>();
}

declare module "{{ createImport 'libEntry' 'client' }}" {
  import { clientRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute } from "#templates/lib/mdx.ts";
  export const createRoutes: () => Array<RawRoute>;
  export default clientRenderFactory();
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import { serverRenderFactory } from "@kosmojs/core/generators";
  import type { RawRoute } from "#templates/lib/mdx.ts";
  export const createRoutes: () => Array<RawRoute>;
  export default serverRenderFactory();
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
