import { QueryClient } from "@tanstack/react-query";

import { store } from "{{ createImport 'libCore' 'ssr' }}";

export const createQueryClient = (options) => {
  const client = new QueryClient(options);
  const ctx = store?.getStore();
  if (ctx) {
    ctx.tsqClient = client;
  }
  return client;
};

export const getQueryClient = () => {
  const ctx = store?.getStore();
  if (!ctx) {
    throw new Error("getQueryClient(): called outside an SSR request scope");
  }
  if (!ctx.tsqClient) {
    ctx.tsqClient = new QueryClient();
  }
  return ctx.tsqClient;
};
