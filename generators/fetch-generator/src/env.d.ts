declare module "virtual:kosmo/backend-app" {
  import type { FetchApp, NodeApp } from "@kosmojs/core";
  const backend: FetchApp | NodeApp | undefined;
  export default backend;
}

declare module "{{ createImport 'libCore' 'ssr' }}" {
  export const store: AsyncLocalStorage;
  export const ssrOrigin: string;
  export const redirectCodes: Array<number>;
}
