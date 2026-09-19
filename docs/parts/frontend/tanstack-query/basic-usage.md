<!-- #region react -->
```tsx
// React: components/User.tsx
import { useQuery } from "@tanstack/react-query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function User({ id }: { id: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["users", id],
    queryFn: () => GET([id]),
  });

  if (isPending) return <div>Loading...</div>;
  return <div>{data.name}</div>;
}
```
<!-- #endregion react -->

<!-- #region solid -->
```tsx
// Solid: components/User.tsx
import { Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function User(props: { id: string }) {
  // Solid takes a thunk so the options track reactively
  const query = useQuery(() => ({
    queryKey: ["users", props.id],
    queryFn: () => GET([props.id]),
  }));

  return (
    <Show when={!query.isPending} fallback={<div>Loading...</div>}>
      <div>{query.data?.name}</div>
    </Show>
  );
}
```
<!-- #endregion solid -->

<!-- #region vue -->
```vue
<!-- Vue: components/User.vue -->
<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import fetchClients from "_/fetch";

const { id } = defineProps<{ id: string }>();
const { GET } = fetchClients["users/[id]"];

const { data, isPending } = useQuery({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else>{{ data?.name }}</div>
</template>
```
<!-- #endregion vue -->

<!-- #region svelte -->
```svelte
<!-- Svelte: components/User.svelte -->
<script lang="ts">
  // Svelte uses createQuery (not useQuery) and takes a thunk
  import { createQuery } from "@tanstack/svelte-query";
  import fetchClients from "_/fetch";

  let { id }: { id: string } = $props();
  const { GET } = fetchClients["users/[id]"];

  const query = createQuery(() => ({
    queryKey: ["users", id],
    queryFn: () => GET([id]),
  }));
</script>

{#if query.isPending}
  <div>Loading...</div>
{:else}
  <div>{query.data?.name}</div>
{/if}
```
<!-- #endregion svelte -->
