import { QueryClient, type QueryClientConfig } from "@tanstack/solid-query";

let client: QueryClient | undefined;

export const createQueryClient = (options?: QueryClientConfig): QueryClient => {
  client = new QueryClient(options);
  return client;
};

export const getQueryClient = (): QueryClient => {
  if (!client) {
    client = new QueryClient();
  }
  return client;
};
