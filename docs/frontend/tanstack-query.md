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

[TanStack Query](https://tanstack.com/query) handles caching,
revalidation and request deduplication on the client.

KosmoJS does not wrap it - it wires the client in, gives each SSR request its own, and leaves the querying to you.

What you get is the `_/query` module and a provider around your app.
What you write is ordinary TanStack Query.

## Enabling and using it

Every folder comes with `tanstack: { query: false }`.
Turn it on in the folder's config:

```ts [kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "react",
    base: "/",
    ssr: true,
    tanstack: { query: true }, // [!code hl]
  },
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
available there - fetch data with an MDX `loader` instead (see [MDX](/frontend/mdx)).

## Basic Usage

The simplest read: `useQuery` against a fetch client, no loader and no seeding.
This runs on the client - the query fetches after the component mounts.
It is the right starting point; reach for the loader (next section) only when you want the
data ready during SSR.

:::tabs key:frontend variant:code
== React
```tsx
<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#react-->
```

== Solid
```tsx
<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#solid-->
```

== Vue
```vue
<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#vue-->
```

== Svelte
```svelte
<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#svelte-->
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
<!--@include: @/parts/frontend/tanstack-query/ssr-warmup.md#react-->
```

== Solid
```tsx
<!--@include: @/parts/frontend/tanstack-query/ssr-warmup.md#solid-->
```

== Vue
```vue
<!--@include: @/parts/frontend/tanstack-query/ssr-warmup.md#vue-->
```

== Svelte
```svelte
<!--@include: @/parts/frontend/tanstack-query/ssr-warmup.md#svelte-->
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

:::tabs key:frontend variant:code
== React
```tsx
<!--@include: @/parts/frontend/tanstack-query/mutations.md#react-->
```

== Solid
```tsx
<!--@include: @/parts/frontend/tanstack-query/mutations.md#solid-->
```

== Vue
```vue
<!--@include: @/parts/frontend/tanstack-query/mutations.md#vue-->
```

== Svelte
```svelte
<!--@include: @/parts/frontend/tanstack-query/mutations.md#svelte-->
```
:::

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
<!--@include: @/parts/frontend/tanstack-query/custom-client.md#react-->
```

== Solid
```tsx
<!--@include: @/parts/frontend/tanstack-query/custom-client.md#solid-->
```

== Vue
```vue
<!--@include: @/parts/frontend/tanstack-query/custom-client.md#vue-->
```

== Svelte
```svelte
<!--@include: @/parts/frontend/tanstack-query/custom-client.md#svelte-->
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
