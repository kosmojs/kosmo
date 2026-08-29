---
title: TanStack Query
description: Integrate TanStack Query with KosmoJS. Build your app around the query
    provider using the client from _/query, prefetch in loaders for warm SSR with no
    duplicated payload, and read with useQuery. Per-framework guides for React, SolidJS, Vue and Svelte.
head:
  - - meta
    - name: keywords
      content: tanstack query, react query, solid query, vue query, svelte query,
        AppProvider, QueryClientProvider, VueQueryPlugin,
        getQueryClient, createQueryClient, dehydrate, hydrate, HydrationBoundary,
        generateHydrationScript, ssr warmup, hydration, useQuery, mutations, invalidateQueries
---

Enable TanStack Query when you create the source folder.
Interactive mode asks whether to enable it; for non-interactive runs pass `--tsq`:

```sh [CLI mode]
pnpm folder --name front --base / --framework react --tsq
```

Opting in adds the `tanstack` option to your framework generator.
You can also add it by hand later if you did not enable it at folder creation:

```ts [kosmo.config.ts]
import {
  defineConfig,
  reactGenerator,
  ssrGenerator,
} from "@kosmojs/dev";

export default defineConfig({
  generators: [
    reactGenerator({ tanstack: { query: true } }), // [!code hl]
    ssrGenerator(),
  ],
});
```

Enabling it deploys a `_/query` runtime, wires a per-request `QueryClient` into
the SSR request scope, and swaps `_/app` for a provider that supplies the client (see below).

Everything else - your app, your reads - you write yourself, as plain TanStack Query.

`_/query` exports two things:

- `getQueryClient()` - resolves the active client. Per-request on the server
  (isolated per request, no cross-request cache leak), a singleton in the
  browser. Takes no arguments; import it in components and loaders and it always
  returns the right instance for the current environment.
- `createQueryClient(options?)` - builds one fresh, configured client and
  registers it as the active one. Call it once, at your app, and pass the result
  to the provider's `client` prop.

Beyond these two, KosmoJS does not wrap TanStack's SSR machinery in a
proprietary helper - warm SSR uses TanStack's own `dehydrate` and
`HydrationBoundary` directly, shown per framework in [SSR Warmup](#ssr-warmup-advanced) below.

MDX folders render static HTML with no client runtime, so TanStack Query is not
available there - fetch data with an MDX `loader` instead (see [MDX](./mdx)).

## Enabling and using it

Enabling the `tanstack.query` option wires everything for you.
The framework generator deploys the `_/query` runtime, swaps `_/app` for a provider
that supplies the query client, and - on the server - gives each request its own client.

None of this touches your app code: the provider seam is part of the
generated foundation (see [Application Structure](./application)), and it is
composed the same way whether the option is on or off.
Toggling the option never asks you to edit, copy, or paste anything.

So there is no setup step here. Once the option is on, the only thing you write is
the read itself - `useQuery` in a component (shown per framework in [Basic Usage](#basic-usage)).

## Basic Usage

The simplest read: `useQuery` against a fetch client, no loader and no seeding.
This runs on the client - the query fetches after the component mounts.
It is the right starting point; reach for the loader (next section) only when you want the
data ready during SSR.

:::tabs key:frontend variant:code
== React
```tsx
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

== Solid
```tsx
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

== Vue
```vue
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

== Svelte
```svelte
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
:::

The read hook is where the frameworks differ most:
- React and Vue take the options object directly
- Solid and Svelte take a thunk (`() => (...)`) so the options stay reactive
- Svelte's hook is `createQuery`, not `useQuery`
- Svelte Query v6 uses runes, so the result is read directly (`query.data`) with no `$` prefix.
- The `queryKey`/`queryFn` shape is the same everywhere.

## SSR Warmup (advanced)

Everything above works without any SSR wiring: `useQuery` fetches on the client
after mount. That is the seamless path, and for most pages it is enough.

If you want a page's data rendered on the server and hydrated warm on the client,
you wire it yourself with TanStack Query's own SSR primitives -
`dehydrate` on the server, `HydrationBoundary` on the client.

This is intentional: KosmoJS provides the client and gets out of the way,
so you use TanStack's documented, framework-native APIs directly.
The mechanism is the same across frameworks -
prefetch into the request client, `dehydrate` it, carry the snapshot to the client,
`hydrate` (or wrap in `HydrationBoundary`) - but the exact idiom is each adapter's own.
Follow your framework's official SSR guide:

- React - https://tanstack.com/query/latest/docs/framework/react/guides/ssr
- Solid - https://tanstack.com/query/latest/docs/framework/solid/guides/ssr
- Vue - https://tanstack.com/query/latest/docs/framework/vue/guides/ssr
- Svelte - https://tanstack.com/query/latest/docs/framework/svelte/ssr

The one KosmoJS-specific detail: get the request-scoped client from
`getQueryClient()` (import from `_/query`) in your loader,
so the client you prefetch into is the same one the render reads.

Use one shared query-options helper in both the loader and the component so the `queryKey` matches -
prefetch under one key and read under another and the cache misses, forcing a refetch.

Sketches per framework - see the official guides above for the full picture:

:::tabs key:frontend variant:code
== React
```tsx
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

== Solid
```tsx
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

== Vue
```vue
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

== Svelte
```svelte
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
:::

`dehydrate` returns a snapshot of the request client's cache; import it from your
`@tanstack/{framework}-query` package.

On React, Vue and Svelte you carry that snapshot to the client
(via the loader data) and hand it to `HydrationBoundary` or `hydrate`,
which merges it into the client cache before components read.

Solid needs none of this - `generateHydrationScript()` carries the cache for you.

## Mutations and Invalidation

Mutations use the same client and need no KosmoJS-specific wiring.
`invalidateQueries` refetches affected queries in place - the thing a loader
alone cannot do without re-navigating.

```tsx [React]
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetchClients from "_/fetch";

const { POST } = fetchClients["users/[id]"];

export default function RenameUser({ id }: { id: string }) {
  const qc = useQueryClient();
  const rename = useMutation({
    mutationFn: (name: string) => POST([id], { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", id] }),
  });
  return <button onClick={() => rename.mutate("New Name")}>Rename</button>;
}
```

The shape is identical across frameworks - swap `useMutation`/`useQueryClient`
for the `@tanstack/{solid,vue,svelte}-query` equivalents. Mutations are
client-side, so SSR does not affect them.

## Configuring a custom client

By default the provider uses the client from `getQueryClient()`, which needs no configuration.

When you want custom defaults - a global `staleTime`, retry policy, and so on -
build the client once with `createQueryClient(options)` and the provider picks it up.

`createQueryClient` both builds the configured client and registers it as the active one,
so every later `getQueryClient()` returns that same instance.

`getQueryClient()` takes no options, so there is no way to pass options that silently get ignored.

Where you call it differs slightly by framework - it goes wherever your app is composed:

:::tabs key:frontend variant:code
== React
```tsx
// app.tsx - pass the configured client to the provider's `client` prop
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
```

== Solid
```tsx
// app.tsx - pass the configured client to the provider's `client` prop
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
```

== Vue
```vue
<!-- app.vue - call createQueryClient in <script setup>; the provider resolves it -->
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
```

== Svelte
```svelte
<!-- app.svelte - pass the configured client to the provider's `client` prop -->
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
```
:::

The `client` prop is typed as the adapter's `QueryClient` and exists only when the
option is enabled - so `<AppProvider client={...}>` type-checks exactly where you
would write it. Omit it and the default client is used.

## Streaming

The warm-SSR path here is exact under string rendering (the default). Streaming
(`renderToStream`) needs the framework's streamed-hydration boundary to capture
queries that resolve mid-stream; until you move a route to streaming, string
mode gives correct, fully-warm SSR.
