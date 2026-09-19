<!-- #region react -->
```tsx
// React: pages/users/[id]/index.tsx
// Prefetch in the loader, dehydrate, then wrap the page in HydrationBoundary.
// https://tanstack.com/query/latest/docs/framework/react/guides/ssr
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { useLoaderData, useParams } from "react-router";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const queryOptions = (id: string) => ({
  queryKey: ["users", id] as const,
  queryFn: () => GET([id]),
});

export const loader = async ({ params }: { params: { id: string } }) => {
  const client = getQueryClient();
  await client.prefetchQuery(queryOptions(params.id));
  return dehydrate(client);
};

function User() {
  const { id } = useParams() as { id: string };
  const { data } = useQuery(queryOptions(id));
  return <div>{data?.name}</div>;
}

export default function Page() {
  const state = useLoaderData();
  return (
    <HydrationBoundary state={state}>
      <User />
    </HydrationBoundary>
  );
}
```
<!-- #endregion react -->

<!-- #region solid -->
```tsx
// Solid: pages/users/[id]/index.tsx
// Solid Query rehydrates through Solid's generateHydrationScript(),
// which the SSR entry already emits - so there is no HydrationBoundary to place.
// Prefetch into the request client and the cache crosses to the browser automatically.
// https://tanstack.com/query/latest/docs/framework/solid/guides/ssr
import { useQuery } from "@tanstack/solid-query";
import { useParams } from "@solidjs/router";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const queryOptions = (id: string) => ({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});

export const preload = ({ params }: { params: { id: string } }) =>
  getQueryClient().prefetchQuery(queryOptions(params.id));

export default function Page() {
  // Solid folders read params through Solid Router's own hook
  const params = useParams();
  const query = useQuery(() => queryOptions(params.id));
  return <div>{query.data?.name}</div>;
}
```
<!-- #endregion solid -->

<!-- #region vue -->
```vue
<!-- Vue: pages/users/[id]/index.vue -->
<!-- Prefetch + dehydrate in the loader; hydrate the page's script setup.
     https://tanstack.com/query/latest/docs/framework/vue/guides/ssr -->
<script lang="ts">
import { dehydrate } from "@tanstack/vue-query";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const queryOptions = (id: string) => ({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});

export const loader = async ({ params }: { params: { id: string } }) => {
  const client = getQueryClient();
  await client.prefetchQuery(queryOptions(params.id));
  return dehydrate(client);
};
</script>

<script setup lang="ts">
import { hydrate, useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { getQueryClient } from "_/query";
import { useLoaderData } from "_/use";

hydrate(getQueryClient(), useLoaderData());

// Vue folders read params through Vue Router's own hook;
// `_/use` on Vue exports useLoaderData only
const route = useRoute();
const { data } = useQuery(queryOptions(route.params.id as string));
</script>

<template>
  <div>{{ data?.name }}</div>
</template>
```
<!-- #endregion vue -->

<!-- #region svelte -->
```svelte
<!-- Svelte: pages/users/[id]/index.svelte -->
<!-- Prefetch + dehydrate in the loader; wrap the page in HydrationBoundary.
     https://tanstack.com/query/latest/docs/framework/svelte/ssr -->
<script module lang="ts">
import { dehydrate } from "@tanstack/svelte-query";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const queryOptions = (id: string) => ({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});

export const loader = async ({ params }: { params: { id: string } }) => {
  const client = getQueryClient();
  await client.prefetchQuery(queryOptions(params.id));
  return dehydrate(client);
};
</script>

<script lang="ts">
import { HydrationBoundary, createQuery, useQueryClient } from "@tanstack/svelte-query";
import { useParams, useLoaderData } from "_/use";

const params = useParams<"users/[id]">();
const query = createQuery(() => queryOptions(params.id));
</script>

<HydrationBoundary state={useLoaderData()} queryClient={useQueryClient()}>
  <div>{query.data?.name}</div>
</HydrationBoundary>
```
<!-- #endregion svelte -->
