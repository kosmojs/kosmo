declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}

declare module "virtual:kosmo/tsq-client" {
  import type { QueryClient, QueryClientConfig } from "@tanstack/svelte-query";
  export const createQueryClient: (options?: QueryClientConfig) => QueryClient;
  export const getQueryClient: () => QueryClient;
}
