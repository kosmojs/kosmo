<!-- #region react -->
// React: app.tsx - pass the configured client to the provider's `client` prop
import { AppProvider } from "_/app";
import { createQueryClient } from "_/query";
import { Outlet } from "react-router";

const client = createQueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

export default function App() {
  return (
    <AppProvider client={client}>
      <Outlet />
    </AppProvider>
  );
}
<!-- #endregion react -->

<!-- #region solid -->
// Solid: app.tsx - pass the configured client to the provider's `client` prop
import { AppProvider } from "_/app";
import { createQueryClient } from "_/query";
import type { ParentComponent } from "solid-js";

const client = createQueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

const app: ParentComponent = (props) => {
  return <AppProvider client={client}>{props.children}</AppProvider>;
};

export default app;
<!-- #endregion solid -->

<!-- #region vue -->
<!-- Vue: app.vue - call createQueryClient in <script setup>; the provider resolves it -->
<script setup lang="ts">
import { AppProvider } from "_/app";
import { createQueryClient } from "_/query";

createQueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
<!-- #endregion vue -->

<!-- #region svelte -->
<!-- Svelte: app.svelte - pass the configured client to the provider's `client` prop -->
<script lang="ts">
  import { AppProvider } from "_/app";
  import { createQueryClient } from "_/query";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  const client = createQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });
</script>

<AppProvider {client}>
  {@render children()}
</AppProvider>
<!-- #endregion svelte -->
