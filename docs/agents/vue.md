---
title: Vue frontend
description: Everything specific to a Vue frontend folder - where the loader goes,
    how a page reads its data, layouts with RouterView, and which hooks exist in _/use.
head:
  - - meta
    - name: keywords
      content: vue, kosmojs vue, useLoaderData, vue-router, RouterView, script setup,
        plain script block, layout.vue, pages index.vue, loader
---

A folder with `frontend: { stack: "vue" }`. Pages are `.vue`, layouts are `layout.vue`.
Routing, fetch clients and validation behave the same for every frontend.
[Frontend&nbsp;intro&nbsp;›](/frontend/intro.md)

## The loader goes in a plain `<script>`

This is the Vue-specific trap. `loader` is a **named module export**, and
`<script setup>` cannot declare one - it must live in an ordinary `<script>` block
alongside it:

```vue [pages/users/[id]/index.vue]
<!-- Vue: pages/users/[id]/index.vue -->
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

<template>
  <div v-if="user"><h1>{{ user.name }}</h1></div>
</template>
```

The router runs the loader before the route renders, through a navigation guard -
no `onMounted`, no manual guard.

## Hooks

`_/use` exists in Vue folders, but exports **`useLoaderData` only**.
Everything else comes from `vue-router`:

| Need | Vue |
|---|---|
| loader data | `useLoaderData()` from `_/use` |
| route params | `useRoute()` from `vue-router` |
| navigate | `useRouter()` from `vue-router` |

`useLoaderData()` returns `T | undefined`, so guard before reading.
A **layout** passes its path-qualified name - `useLoaderData("dashboard/layout")` -
where a page passes nothing.

## Layouts

```vue [layout.vue]
<!-- Vue: layout.vue -->
<script setup lang="ts">
// layout-specific logic
</script>

<template>
  <div class="dashboard">
    <nav>...</nav>
    <main>
      <RouterView />
    </main>
    <footer>...</footer>
  </div>
</template>
```

Child routes render through `<RouterView />`, not through a prop.

## Worth knowing

- Vue, Svelte and MDX share one per-route loader store keyed by route name,
which is why a layout must pass its own name to the hook.
- The default plugin is `@vitejs/plugin-vue`. Pass your own through
`stack: { name: "vue", plugin: vue({ ... }) }`, never through `viteConfig.plugins`.
[Configuration&nbsp;›](/essentials/config.md#frontend-stack-required)
- Streaming SSR is available for Vue, alongside React and SolidJS.
Svelte and MDX render to a string only.
