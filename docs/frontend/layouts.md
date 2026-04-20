---
title: Nested Layouts
description: Compose shared UI at any level of the route hierarchy using layout files.
    Navigation, sidebars, auth shells, and data loading scoped to route subtrees
    for React, SolidJS, Vue and MDX applications.
head:
  - - meta
    - name: keywords
      content: nested layouts, layout components, route hierarchy, shared ui,
        react outlet, vue router view, solidjs children, mdx layouts,
        layout data loading, kosmojs layouts
---

Layout files wrap groups of routes with shared UI - without duplicating
components across every page.

## 🎨 Define a Layout

Create a `layout.tsx` (or `.vue` / `.mdx`) in any folder under `pages/`,
and it automatically wraps every route in that folder and its subfolders.
Nest layouts by nesting folders.

```
pages/
  dashboard/
    layout.tsx         ← wraps all /dashboard/* pages
    settings/
      layout.tsx       ← wraps all /dashboard/settings/* pages
      profile/
        index.tsx      ← wrapped by both layouts
      index.tsx
    index.tsx
```

For `/dashboard/settings/profile`, the render order is:

```
App.tsx (global wrapper)
└── dashboard/layout.tsx
    └── dashboard/settings/layout.tsx
        └── dashboard/settings/profile/index.tsx
```

No configuration, no imports - the file system defines the hierarchy.

Child routes cannot escape parent layouts. Once a layout is established at a
folder level, all routes beneath it inherit it - keeping the UI hierarchy
predictable.

## 📁 Layout File Naming

Only the lowercase form is recognized as a special file. `Layout.tsx`,
`LAYOUT.vue`, and other variations are treated as regular components.

| Framework | Recognized name |
|-----------|----------------|
| React / SolidJS | `layout.tsx` |
| Vue | `layout.vue` |
| MDX | `layout.mdx` |

Each source folder runs a single framework and ignores files belonging to
others: React/SolidJS folders ignore `.vue` files, Vue folders ignore `.tsx`.

When you create a new layout file, `KosmoJS` generates framework-appropriate
boilerplate immediately. Some editors may require a brief unfocus/refocus to
load the generated content.

## 🛠 Layout Implementation

Each framework renders child routes differently:

::: code-group

```tsx [React · layout.tsx]
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="dashboard">
      <nav>...</nav>
      <main>
        <Outlet />
      </main>
      <footer>...</footer>
    </div>
  );
}
```

```tsx [SolidJS · layout.tsx]
import type { ParentComponent } from "solid-js";

const Layout: ParentComponent = (props) => {
  return (
    <div class="dashboard">
      <nav>...</nav>
      <main>
        {props.children}
      </main>
      <footer>...</footer>
    </div>
  );
};

export default Layout;
```

```vue [Vue · layout.vue]
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

```mdx [MDX · layout.mdx]
<nav>
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
</nav>

<main>
  {props.children}
</main>

<footer>
  Built with KosmoJS
</footer>
```
:::

React renders child routes via `<Outlet />`. SolidJS and MDX use `props.children`.
Vue uses `<RouterView />`.

## 📥 Data Loading in Layouts

Layout data loading follows the same per-framework patterns as page components:

::: code-group

```tsx [React · layout.tsx]
import { Outlet, useLoaderData } from "react-router";
import fetchClients, { type ResponseT } from "_/fetch";

export const loader = fetchClients["dashboard/data"].GET;

export default function Layout() {
  const data = useLoaderData<ResponseT["dashboard/data"]["GET"]>();
  // ...
  return <Outlet />;
}
```

```tsx [SolidJS · layout.tsx]
import type { ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";
import fetchClients from "_/fetch";

export const preload = fetchClients["dashboard/data"].GET;

const Layout: ParentComponent = (props) => {
  const data = createAsync(preload);
  // ...
  return <>{props.children}</>;
};

export default Layout;
```

```vue [Vue · layout.vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import fetchClients, { type ResponseT } from "_/fetch";

const data = ref<ResponseT["dashboard/data"]["GET"] | null>(null);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    data.value = await fetchClients["dashboard/data"].GET();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  ...
</template>
```
:::

React and SolidJS loaders/preloads run before the layout renders - data is
available immediately and shared across all child routes without duplicate
fetches. Vue requires manual lifecycle management via `onMounted` or navigation
guards; see the
[Vue Router documentation](https://router.vuejs.org/guide/advanced/data-fetching.html)
for advanced patterns.

## 🌐 Global Layout via App File

The `App.{tsx,vue,mdx}` at the source folder root wraps every route - the right
place for truly global concerns like authentication checks, analytics tracking
or error boundaries.

```txt
front/
├── App.tsx              ← wraps everything
└── pages/
    ├── dashboard/
    │   └── layout.tsx
    └── index/
        └── index.tsx
```

## 📊 Layout Hierarchy Example

For a deeply nested route like `/dashboard/settings/security`:

```txt
front/
├── App.tsx                        ← Level 1: global wrapper
└── pages/
    └── dashboard/
        ├── layout.tsx             ← Level 2: dashboard wrapper
        └── settings/
            ├── layout.tsx         ← Level 3: settings wrapper
            └── security/
                ├── layout.tsx     ← Level 4: security wrapper
                └── index.tsx      ← Level 5: page component
```

Renders as:

```
App
└── Dashboard Layout
    └── Settings Layout
        └── Security Layout
            └── Security Page
```

## 💡 Best Practices

- **Keep layouts focused.** Each layout handles concerns for its own scope - dashboard navigation in the dashboard layout, not global auth state.
- **Fetch shared data at the right level.** If multiple child routes need the same data, load it in their common parent layout rather than duplicating the fetch.
- **Use layouts for shared behavior.** Beyond UI structure, layouts suit shared logic: permission checks, analytics, or subscription state scoped to a route group.
- **Avoid deep nesting without purpose.** Three or four levels is reasonable. Beyond that, consider whether the hierarchy reflects genuine UI structure or accidental complexity.
- **Handle loading states explicitly.** Layout data loading can delay rendering - show appropriate fallbacks, especially in Vue where loading is managed manually.

## ⚠️ Common Pitfalls

- **Case sensitivity.** Only `layout.{tsx,vue,mdx}` are recognized as layout files.
- **Framework file isolation.** `.vue` files in a React/SolidJS/MDX folder are ignored, and `.tsx/.mdx` files in a Vue folder are ignored.
- **No layout opt-out.** Child routes always inherit parent layouts. Routes that shouldn't share a layout belong in a different directory branch.
- **Data loading differs by framework.** React and SolidJS have built-in route-level data patterns. Vue requires manual lifecycle management. MDX layouts delegate data loading to a separate component in a `.tsx` file.
