import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getQueryClient } from "./query";

export const AppProvider = ({
  client,
  children,
}: {
  client?: QueryClient;
  children: ReactNode;
}) => {
  const queryClient = client ?? getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
