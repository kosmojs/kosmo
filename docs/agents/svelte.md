---
title: Svelte frontend
description: Everything specific to a Svelte frontend folder - why loader and staticParams
    need script module, how hooks must be called, and layouts with the children snippet.
head:
  - - meta
    - name: keywords
      content: svelte, kosmojs svelte, script module, useLoaderData, useParams, $props,
        render children, layout.svelte, staticParams, string-only SSR
---

A folder with `frontend: { stack: "svelte" }`. Pages are `.svelte`, layouts are `layout.svelte`.
Routing, fetch clients and validation behave the same for every frontend.
[Frontend&nbsp;intro&nbsp;›](/frontend/intro.md)

## Module exports need `<script module>`

This is the Svelte-specific trap. `loader` and `staticParams` are **module exports**,
so they belong in `<script module>` - the instance `<script>` runs per component and
cannot declare them:

```svelte [pages/users/[id]/index.svelte]
<!-- Svelte: pages/users/[id]/index.svelte -->
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

{#if user}
  <h1>{user.name}</h1>
{/if}
```

The router runs the loader before render, so the data is there on first paint.

## Hooks

`_/use` exists in Svelte folders and is the full set - `useLoaderData`, `useRoute`,
`useParams`, `useParamsEntries`, `useSearchParams`. There is no third-party router
to import from.

Hooks must be called **at the top level of a `<script>` block**, never inside a
function or at module scope:

```svelte
<script lang="ts">
import { useParams } from "_/use";

const { id } = useParams<"users/[id]">();   // top level
</script>
```

`useLoaderData()` returns `T | undefined`. A **layout** passes its path-qualified
name - `useLoaderData("dashboard/layout")` - where a page passes nothing.
A `loader` cannot use hooks; it receives the resolved route object instead.

## Layouts

```svelte [layout.svelte]
<!-- Svelte: layout.svelte -->
<script lang="ts">
let { children } = $props();
</script>

<div class="dashboard">
  <nav>...</nav>
  <main>
    {@render children()}
  </main>
  <footer>...</footer>
</div>
```

Child routes arrive as the `children` snippet and render with `{@render children()}`.

## Worth knowing

- **SSR is string-only.** `renderMode: "stream"` is not available for Svelte folders;
React, SolidJS and Vue can stream.
- Svelte has no third-party router, so KosmoJS supplies the matcher and emits its own
`RawRoute` shape rather than a framework route tree. [Routing&nbsp;›](/routing/rationale.md)
- TanStack Query names its hooks `createQuery` / `createMutation`, not `use*`,
and they take a thunk.
