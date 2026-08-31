declare module "virtual:kosmo/backend-app" {
  import type { FetchApp, NodeApp } from "@kosmojs/core";
  const backend: FetchApp | NodeApp | undefined;
  export default backend;
}

declare module "{{ createImport 'entry' 'server' }}" {
  import type { SSRSetup } from "@kosmojs/core";
  const app: SSRSetup;
  export default app;
}

declare module "{{ createImport 'libCore' }}" {
  export const base: string;
  export const apiBase: string;
}

declare module "{{ createImport 'libCore' 'ssr' }}" {
  import type { AsyncLocalStorage } from "node:async_hooks";
  export type RequestContext = {
    headers?: HeadersInit;
    tsqClient?: unknown;
    error?: unknown;
  };
  export const store: AsyncLocalStorage<RequestContext>;
  export const ssrOrigin: string;
  export const redirectCodes: Array<number>;
}

declare module "{{ createImport 'libEntry' 'server' }}" {
  import type { SSRRenderWrapper } from "@kosmojs/core";
  export const renderWrapper: SSRRenderWrapper;
}

declare module "{{ createImport 'lib' '@ssr/routes' }}" {
  export const routeMap: Array<{ pathPattern: string, renderMode: string }>;
}
