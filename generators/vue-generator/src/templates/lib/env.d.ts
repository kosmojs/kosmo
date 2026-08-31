declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "virtual:kosmo/tsq-client" {
  import type { QueryClient, QueryClientConfig } from "@tanstack/vue-query";
  export const createQueryClient: (options?: QueryClientConfig) => QueryClient;
  export const getQueryClient: () => QueryClient;
}
