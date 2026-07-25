declare module "{{ createImport 'entry' 'server' }}" {
  import type { SSRSetup } from "@kosmojs/core";
  const app: SSRSetup;
  export default app;
}

declare module "{{ createImport 'libCore' }}" {
  export const base: string;
  export const apiBase: string;
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { SSRRenderWrapper } from "@kosmojs/core";
  export const renderWrapper: SSRRenderWrapper;
}

declare module "{{ createImport 'lib' '@ssr/api' }}" {
  import type { FetchApp, NodeApp } from "@kosmojs/core";
  export const apiApp: FetchApp | NodeApp | undefined;
}

declare module "{{ createImport 'lib' '@ssr/routes' }}" {
  export const routeMap: Array<{ pathPattern: string, renderMode: string }>;
}
