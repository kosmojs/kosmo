---
title: SolidJS frontend
description: Everything specific to a SolidJS frontend folder - preload with query(),
    reading data through createAsync, the Suspense boundary you must supply, and layouts.
head:
  - - meta
    - name: keywords
      content: solid, solidjs, kosmojs solid, createAsync, query, preload, Suspense,
        solidjs router, layout.tsx, ParentComponent, no _/use in solid
---

A folder with `frontend: { stack: "solid" }`. Pages are `.tsx`, layouts are `layout.tsx`.
Routing, fetch clients and validation behave the same for every frontend.
[Frontend&nbsp;intro&nbsp;›](/frontend/intro.md)

## `_/use` does not exist here

Like React, a SolidJS folder has no `_/use` - the import does not resolve.
Everything comes from `@solidjs/router`:

| Need | SolidJS |
|---|---|
| loader data | `createAsync()` from `@solidjs/router` |
| route params | `useParams()` from `@solidjs/router` |
| navigate | `useNavigate()` from `@solidjs/router` |

## `preload` and `createAsync` must share a cache key

This is the SolidJS-specific trap. A page exports `preload`, which the router calls
on link hover and navigation intent; the component then reads with `createAsync`.
Wrap the fetch in `query()` so both hit **one** cache key - otherwise the request
runs twice:

```tsx [pages/users/[id]/index.tsx]
// Solid: pages/users/[id]/index.tsx
import { createAsync, query, useParams } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const getUser = query((id: string) => GET([id]), "user");

export const preload = ({ params }) => getUser(params.id);

export default function UserProfile() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return <div>{user()?.name}</div>;
}
```

`createAsync` infers its type from the fetcher, so no annotation is needed.

## Suspense is your responsibility

`createAsync` **suspends**, and KosmoJS ships no boundary for you. An async read
without a `<Suspense>` above it throws. React, Vue, Svelte and MDX resolve their
loaders before render and need none - this is Solid only.

## Layouts

```tsx [layout.tsx]
// Solid: layout.tsx
import type { ParentComponent } from "solid-js";

const Layout: ParentComponent = (props) => (
  <div class="dashboard">
    <nav>...</nav>
    <main>{props.children}</main>
    <footer>...</footer>
  </div>
);

export default Layout;
```

Child routes arrive as `props.children`. A layout's data is kept distinct by the
`query()` cache string you supply, not by the hook read.

## Worth knowing

- Note `class`, not `className`.
- Streaming SSR is available for SolidJS, alongside React and Vue.
- TanStack Query hooks take a thunk here - `useQuery(() => ({ ... }))`.
- The default plugin is `vite-plugin-solid`. Pass your own through
`stack: { name: "solid", plugin: solid({ ... }) }`, never through `viteConfig.plugins`.
