---
title: Data Preloading
description: Prefetch route data before components render using React Router's
    loader pattern, SolidJS Router's query/preload, and Vue, Svelte and MDX loader exports.
    Type-safe data availability derived from API endpoint definitions.
head:
  - - meta
    - name: keywords
      content: react router loaders, useLoaderData, solidjs preload, createAsync, query,
        vue loader, svelte loader, mdx loader, data prefetching, route data loading, async loading,
        type-safe data, kosmojs data fetching, suspense boundary, error boundary
---

Preloading ensures data is ready before a component renders, eliminating
loading spinners for route-level data and creating seamless navigation
experiences. Each framework has its own mechanism - all integrate naturally
with `KosmoJS`'s generated fetch clients.

## API Endpoint

Start by creating an API endpoint that provides the data.
The same endpoint is used across every framework:

```ts [api/users/data/types.ts]
export type UserData = {
  users: Array<{ id: number; name: string }>;
};
```

:::tabs key:backend variant:code
== Hono
```ts
import { defineRoute } from "_/api";
import type { UserData } from "./types";

export default defineRoute<"users/data">(({ GET }) => [
  GET<{ response: [200, "json", UserData] }>(async (ctx) => {
    return ctx.json(await fetchUserData());
  }),
]);
```

== H3
```ts
import { defineRoute } from "_/api";
import type { UserData } from "./types";

export default defineRoute<"users/data">(({ GET }) => [
  GET<{ response: [200, "json", UserData] }>(async (event) => {
    return await fetchUserData();
  }),
]);
```

== Koa
```ts
import { defineRoute } from "_/api";
import type { UserData } from "./types";

export default defineRoute<"users/data">(({ GET }) => [
  GET<{ response: [200, "json", UserData] }>(async (ctx) => {
    ctx.body = await fetchUserData();
  }),
]);
```
:::

Declaring `response` is what gives the generated client a typed return value here -
and, on the client, an entry in the `ResponseT` map.
[Details&nbsp;›](/fetch/type-safety#response-types)

## Page Integration

:::tabs key:frontend variant:code
== React
```tsx
import { useLoaderData } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/data"];

// Export the fetch function as loader -
// React Router calls it before the component renders
export const loader = () => GET();

export default function Page() {
  // useLoaderData retrieves the already-fetched result - no duplicate request
  const data = useLoaderData();

  return (
    <div>
      {data && <UserList users={data.users} />}
    </div>
  );
}
```

== Solid
```tsx
import { Suspense } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/data"];

// wrap the fetch in query() so preload and createAsync share one cache key -
// the raw client GET is not cached, so both must call the same query-wrapped fn
const getData = query(() => GET(), "users/data");

// SolidJS Router calls preload on link hover and navigation intent
export const preload = () => getData();

export default function Page() {
  // createAsync reads the same query cache the preload warmed - no duplicate request
  const data = createAsync(() => getData());

  // reading data() in JSX suspends while the value is pending (cold navigation),
  // so it needs a <Suspense> above it - see "Suspense Is Your Responsibility"
  return (
    <Suspense fallback={<Spinner />}>
      <UserList users={data()?.users} />
    </Suspense>
  );
}
```

== Vue
```vue
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/data"];

// the loader is a module-level export, so it lives in a plain <script> block -
// <script setup> compiles to setup() and cannot hold ES exports
export const loader = () => GET();
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

// the router runs the loader before the component renders; read its result here
const data = useLoaderData();
</script>

<template>
  <div>
    <UserList v-if="data" :users="data.users" />
  </div>
</template>
```

== Svelte
```svelte
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/data"];

// the loader lives in the module <script> block -
// the instance <script> can't hold ES exports
export const loader = () => GET();
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

// the router runs the loader before the component renders; read its result here
const data = useLoaderData();
</script>

{#if data}
  <UserList users={data.users} />
{/if}
```

== MDX
```mdx
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

export const { GET } = fetchClients["users/data"];

export const loader = () => GET();

export const Users = () => {
  const data = useLoaderData();
  return <UserList users={data.users} />;
};

# Users

<Users />
```
:::

## How It Works

**React** - the `loader` export tells React Router what function to call
before rendering. `useLoaderData` retrieves the result that was already
fetched - no duplicate request. Type safety flows end-to-end: the fetch
client's `GET` is typed from your API definition, and `useLoaderData` is
parameterized with the matching response type.

**SolidJS** - the `preload` export tells SolidJS Router to call the function
on link hover and navigation intent. Dedup comes from `query()`: it caches by
the arguments passed to the wrapped function, so `preload` and `createAsync`
calling the same `getData()` hit one cache key and the fetch runs once. The
raw client `GET` is not itself cached, so wrapping it in `query()` is what makes
the preloaded result reusable - `createAsync(() => GET())` on the bare client
would fetch again.

**Vue** - a page exports a `loader` (in a plain `<script>` block, since
`<script setup>` cannot hold ES exports), and the router runs it before the
component renders. The component reads the result with `useLoaderData()` - no
`onMounted`, no manual `ref`, and the data is available synchronously at first
render, so it works under SSR without a re-fetch on hydration.

**Svelte** - identical shape to Vue and MDX: a page exports a `loader` from its
module `<script>` block, the router runs it before render, and the instance
`<script>` reads the result with `useLoaderData()`. KosmoJS uses only Svelte's
UI layer, not SvelteKit, so data loading is the loader, not SvelteKit's `load`.

**MDX** - export a `loader` and read its result with the `useLoaderData()`
hook; `props` stays entirely yours. It runs before the page renders, on both
server and client, through the same fetch client used elsewhere - so a request
made during SSR is replayed on hydration rather than firing twice.

## Suspense Is Your Responsibility

Async data reads need a `<Suspense>` boundary above them, and `KosmoJS` does
not provide one for you. The generated `App` boilerplate renders its children
directly - it deliberately does not wrap the app in `<Suspense>`, because a
single app-wide boundary is an anti-pattern: any pending fetch anywhere
collapses the whole page to one fallback, and unrelated async work shares a
single loading state. Where the boundary goes is a design decision only you
can make, so `KosmoJS` leaves it to you.

This matters most for **SolidJS**. `createAsync` reports its pending state to
the nearest `<Suspense>` and propagates errors to the nearest
`<ErrorBoundary>`; with no boundary above it, the pending read has nowhere to
report and the component cannot render its resolved content. Wrap the data
component - or a sensible subtree around it - yourself:

```tsx [SolidJS]
import { Suspense } from "solid-js";

export default function Page() {
  const data = createAsync(() => getData());

  return (
    <Suspense fallback={<Spinner />}>
      <UserList users={data()?.users} />
    </Suspense>
  );
}
```

**React** - the `loader`/`useLoaderData` pattern shown above resolves before
render and does not suspend, so it needs no boundary. You only need
`<Suspense>` if you reach for `React.lazy` or a promise-throwing `use()` read.

**Vue** - the `loader`/`useLoaderData` pattern resolves before render and does
not suspend either, so it needs no boundary. A `<Suspense>` boundary is only
relevant if you reach for async `<script setup>` (a top-level `await`), which
turns the component async and wants a boundary above it.

**Svelte** - the `loader`/`useLoaderData` pattern resolves before render and
does not suspend, so it needs no boundary in the common case.

**MDX** - `loader`/`useLoaderData` resolves before render and does not suspend,
so it needs no boundary in the common case.

Wrapping the entire app in one boundary does work if you accept the tradeoff -
it is your call, not a default `KosmoJS` will make for you. The guidance is to
scope boundaries to the components or sections that actually fetch, so a
spinner in one area never blanks the rest of the page.
