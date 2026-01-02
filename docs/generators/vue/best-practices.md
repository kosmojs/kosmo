---
title: Vue Generator - Best Practices
description: Recommended patterns for building Vue 3 applications with KosmoJS,
    including typed navigation, Suspense usage, SSR hydration, and generator-driven file structure.
head:
  - - meta
    - name: keywords
      content: vue best practices, vue 3 kosmojs, suspense boundaries, typed routing, hydration patterns
---

### 💡 Vue Best Practices

As you develop with `Vue` and `KosmoJS`,
these patterns help keep your project scalable and maintainable.

---

#### 🔗 Trust Generated Navigation Types

When linking between pages,
use the typed tuple format provided by the `<Link>` component.
This prevents broken navigation and ensures parameters match route expectations.

If you later rename or move a page,
`TypeScript` highlights every affected link -
refactoring becomes safe and mechanical instead of fragile.

---

#### 🗂 Keep App.vue Focused on Shell Responsibilities

`App.vue` should remain responsible only for global concerns like:

- layout scaffolding
- theme or design system providers
- authentication state providers
- primary `<Suspense>` boundary

Page-specific logic belongs in the page component itself,
not in the root app.

---

#### 🧮 Place Data Fetching Where It's Needed

If a page needs data **as soon as a route is entered**,
use Navigation Guards inside the router setup
or async logic triggered from `setup()` for initial loading.

When data depends on **user interaction** (sorting, filtering, pagination),
use the Composition API (`ref`, `watch`, or composables)
to fetch data reactively within the component.

---

#### 🔄 Don't Edit Generated Files

Route configuration in `lib` is generated from the folder structure in `pages/`.
Editing generated files will be overwritten the next time the generator runs.

Instead:

- modify or rename files in `pages/`
- navigation helpers and generated routes update automatically

Your filesystem drives the truth.

---

#### 🧭 Structure Suspense Boundaries Strategically

The default `App.vue` includes a global `<Suspense>` boundary
to catch async components when navigating.

For sections with different loading speeds,
add **nested Suspense boundaries** inside the route component:

```vue
<template>
  <Suspense>
    <MainContent />
    <template #fallback>
      <LoadingIndicator />
    </template>
  </Suspense>
</template>
```

#### 🌐 Understand Hydration Behavior with SSR

During SSR, HTML is already rendered on the server.
The client entry hydrates that markup using `createSSRApp`.

Avoid directly manipulating the DOM before hydration completes -
`Vue` must first attach event listeners without modifying the HTML structure.
