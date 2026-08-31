import { QueryClient } from "@tanstack/solid-query";

let client = undefined;

export const createQueryClient = (options) => {
  client = new QueryClient(options);
  return client;
};

export const getQueryClient = () => {
  if (!client) {
    client = new QueryClient();
  }
  return client;
};
