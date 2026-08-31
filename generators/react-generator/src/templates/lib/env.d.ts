declare module "virtual:kosmo/tsq-client" {
  import type { QueryClient, QueryClientConfig } from "@tanstack/react-query";
  export const createQueryClient: (options?: QueryClientConfig) => QueryClient;
  export const getQueryClient: () => QueryClient;
}
