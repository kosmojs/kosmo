import type { ParentComponent } from "solid-js";
import { type QueryClient, QueryClientProvider } from "@tanstack/solid-query";

import { getQueryClient } from "./query";

export const AppProvider: ParentComponent<{ client?: QueryClient }> = (props) => {
  return (
    <QueryClientProvider client={props.client ?? getQueryClient()}>
      {props.children}
    </QueryClientProvider>
  );
};
