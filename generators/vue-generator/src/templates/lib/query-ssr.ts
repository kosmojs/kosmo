import { QueryClient, type QueryClientConfig } from "@tanstack/vue-query";

import { store } from "{{ createImport 'lib' '@ssr/base' }}";

export const createQueryClient = (options?: QueryClientConfig): QueryClient => {
  const client = new QueryClient(options);
  const ctx = store?.getStore();
  if (ctx) {
    ctx.tsqClient = client;
  }
  return client;
};

export const getQueryClient = (): QueryClient => {
  const ctx = store?.getStore();
  if (!ctx) {
    throw new Error("getQueryClient(): called outside an SSR request scope");
  }
  if (!ctx.tsqClient) {
    ctx.tsqClient = new QueryClient();
  }
  return ctx.tsqClient as QueryClient;
};
