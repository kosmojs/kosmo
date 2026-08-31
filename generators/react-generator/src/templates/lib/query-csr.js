import { QueryClient } from "@tanstack/react-query";

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
