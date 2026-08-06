<script lang="ts">
  import { type QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  import type { Snippet } from "svelte";

  import { getQueryClient } from "../query";

  let { client, children }: {
    client?: QueryClient;
    children: Snippet;
  } = $props();

  const queryClient = $derived(client ?? getQueryClient());
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
