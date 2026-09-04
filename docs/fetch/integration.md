---
title: Fetch Client Integration
description: Integrate KosmoJS fetch clients with SolidJS query/createAsync,
    React, Vue and Svelte useLoaderData, and MDX hooks. Type safety flows through all framework abstractions.
head:
  - - meta
    - name: keywords
      content: solidjs integration, react hooks, createAsync, preload, useLoaderData,
        fetch client integration, vue loader, svelte loader, mdx loader, typescript hooks,
        isomorphic fetch, ssr hydration, in-process fetch, suspense boundary, error boundary
---

The fetch client returns standard promises, so it fits naturally into whatever async pattern your framework uses.

:::tabs key:frontend variant:code
== React
```tsx
import { useLoaderData } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

// React Router passes { params, request } into the loader; read params the
// native way and pass them to the client as an array
export const loader = ({ params }) => GET([params.id]);

export default function UserProfile() {
  const user = useLoaderData();
  return <div>{user.name}</div>;
}
```

== Solid
```tsx
import { Suspense } from "solid-js";
import { createAsync, query, useParams } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

// wrap the fetch in query() so preload and createAsync share one cache key -
// both call getUser with the same arg and the result is fetched once
const getUser = query((id: string) => GET([id]), "user");

// SolidJS Router calls preload on navigation intent; read params from its arg
export const preload = ({ params }) => getUser(params.id);

export default function UserProfile() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return <Suspense>{user()?.name}</Suspense>;
}
```

== Vue
```vue
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

// the loader is a module-level export, so it lives in a plain <script> block -
// <script setup> compiles to setup() and cannot hold ES exports
export const loader = ({ params }) => GET([params.id]);
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

<template>
  <div>{{ user.name }}</div>
</template>
```

== Svelte
```svelte
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

// the loader lives in the module <script> block; the instance <script> can't hold ES exports
export const loader = ({ params }) => GET([params.id]);
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

<div>{user.name}</div>
```

== MDX
```mdx
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

const { GET } = fetchClients["users/[id]"];
export const loader = ({ params }) => GET([params.id]);

export const user = () => useLoaderData();

export const User = () => {
  return <div>{user()?.name}</div>;
};

<User />
```
:::

Types flow through these abstractions - loaders, resources, hooks, and components automatically
know the response shape from your API definition.

KosmoJS only owns the envelope - the typed fetch client and how requests cross the wire.
Everything above it is the framework's own model: Solid's `query`/`createAsync`, React Router's
`loader` and `useLoaderData`, Vue's `useLoaderData`, Svelte's `useLoaderData`, MDX's `useLoaderData` -
each reads through its native patterns, with no proprietary abstraction layered on top.

The client is just a typed function that takes the params array you build and returns a promise; where and how
you call it is entirely the framework's.

## These Integrations Work Under SSR Too

The client returns standard promises, so nothing above changes when the page is server-rendered.

What matters is **when** the fetch fires: loaders and preloaded resources run during the SSR render,
so they take the in-process path and their result is reused on hydration rather than refetched.

A fetch in `useEffect` / `onMounted` does not run during SSR - it fetches in the browser after hydration, like a plain CSR app.

[Isomorphic clients&nbsp;›](/fetch/isomorphic-clients)

## Suspense Is Your Responsibility

Solid's `createAsync` (like `createResource`) suspends: it reports its pending
state to the nearest `<Suspense>` boundary and propagates errors to the nearest
`<ErrorBoundary>`. `KosmoJS` does not provide either for you - the seeded
`App` boilerplate renders its children directly, deliberately not wrapping the
app in `<Suspense>`, because one app-wide boundary is an anti-pattern: any
pending fetch anywhere collapses the whole page to a single fallback and
unrelated async work shares one loading state.

Scope the boundary to the data component or a sensible subtree yourself:

```tsx [SolidJS]
import { Suspense } from "solid-js";
import { createAsync, useParams } from "@solidjs/router";

export default function UserProfile() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}
```

React's `loader`/`useLoaderData` resolves before render and does not suspend,
so it needs no boundary unless you reach for `React.lazy` or a promise-throwing `use()`.
The same holds for Vue, Svelte, and MDX loaders - they resolve before render, so only
Solid's `createAsync` needs a boundary in the common case.
Wrapping the whole app in one boundary does work if you accept the
tradeoff - it is your call, not a default `KosmoJS` makes for you. See
[Data Preloading](/frontend/data-preload#suspense-is-your-responsibility) for the
full breakdown.
