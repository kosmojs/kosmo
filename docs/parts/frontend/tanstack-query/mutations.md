<!-- #region react -->
// React: components/RenameUser.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetchClients from "_/fetch";

const { POST } = fetchClients["users/[id]"];

export default function RenameUser({ id }: { id: string }) {
  const qc = useQueryClient();
  const rename = useMutation({
    mutationFn: (name: string) => POST([id], { json: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", id] }),
  });
  return <button onClick={() => rename.mutate("New Name")}>Rename</button>;
}
<!-- #endregion react -->

<!-- #region solid -->
// Solid: components/RenameUser.tsx
// Solid's hooks take a thunk, like useQuery above
import { useMutation, useQueryClient } from "@tanstack/solid-query";
import fetchClients from "_/fetch";

const { POST } = fetchClients["users/[id]"];

export default function RenameUser(props: { id: string }) {
  const qc = useQueryClient();
  const rename = useMutation(() => ({
    mutationFn: (name: string) => POST([props.id], { json: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", props.id] }),
  }));
  return <button onClick={() => rename.mutate("New Name")}>Rename</button>;
}
<!-- #endregion solid -->

<!-- #region vue -->
<!-- Vue: components/RenameUser.vue -->
<script setup lang="ts">
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import fetchClients from "_/fetch";

const props = defineProps<{ id: string }>();

const { POST } = fetchClients["users/[id]"];

const qc = useQueryClient();
const rename = useMutation({
  mutationFn: (name: string) => POST([props.id], { json: { name } }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["users", props.id] }),
});
</script>

<template>
  <button @click="rename.mutate('New Name')">Rename</button>
</template>
<!-- #endregion vue -->

<!-- #region svelte -->
<!-- Svelte: components/RenameUser.svelte -->
<script lang="ts">
  // Svelte uses createMutation (not useMutation) and takes a thunk
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import fetchClients from "_/fetch";

  let { id }: { id: string } = $props();

  const { POST } = fetchClients["users/[id]"];

  const qc = useQueryClient();
  const rename = createMutation(() => ({
    mutationFn: (name: string) => POST([id], { json: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", id] }),
  }));
</script>

<button onclick={() => rename.mutate("New Name")}>Rename</button>
<!-- #endregion svelte -->
