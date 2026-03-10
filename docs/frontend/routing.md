---
title: Routing
description: Watch-based route generation, lazy-loaded components, data loading
  integration, and nested layout patterns for React, SolidJS, and Vue applications
  in KosmoJS.
head:
  - - meta
    - name: keywords
      content: react route generation, solidjs routing, vue routing, automatic routing,
        lazy components, loader integration, preload function, route parameters,
        code splitting, dynamic imports, nested routes, layout components,
        route hierarchy, outlet pattern, router view, kosmojs routing
---

Each framework generator continuously watches your `pages` directory. When a
page component is created, the generator analyzes its filesystem location,
produces a corresponding route configuration, and writes it to your `lib`
directory for the router to consume - without any manual wiring.

## 📦 Lazy Loading

All page components are lazy-loaded by default. Route code is excluded from
the initial JavaScript bundle and fetched on demand when a user navigates to
that path. This keeps initial payloads small, accelerates application startup,
and ensures users download only the code for routes they actually visit.

## 🗺️ Generated Route Shape

The route object written to `lib` differs slightly per framework to match each
router's expected format:

::: code-group

```ts [React]
// React Router receives a flat route definition.
// The loader is wired automatically when your page exports one.
{
  path: "/users/:id",
  lazy: () => import("@/front/pages/users/[id]"),
}
```

```ts [SolidJS]
// SolidJS Router receives component and preload as separate keys.
// The preload function is called on link hover and navigation intent.
{
  path: "/users/[id]",
  component: lazy(() => import("@/front/pages/users/[id]")),
  preload: () =>
    import("@/front/pages/users/[id]").then(
      (mdl) => (mdl as ComponentModule).preload?.()
    ),
}
```

```ts [Vue]
// Vue Router receives a standard lazy route definition.
{
  name: "users/[id]",
  path: "/users/[id]",
  component: () => import("@/front/pages/users/[id]/index.vue"),
}
```

:::

## 🔄 Data Loading on Navigation

React and SolidJS integrate data fetching directly into the route lifecycle.

**React** - when a page exports a `loader` function, React Router executes it
at strategic moments: initial page load, link hover, and navigation initiation.
Data is available before the component renders, eliminating loading spinners
for route-level data.

**SolidJS** - when a page exports a `preload` function, SolidJS Router calls it
on link hover and navigation intent. The preload result is cached and reused by
`createAsync` inside the component, so no duplicate requests are made.

**Vue** - preload hooks are not yet part of the Vue generator. Route-level data
fetching is handled through navigation guards in `router.ts` or reactive
`setup()` logic within the component. Prefetching support is under
consideration - contributions are welcome! 🙌

## 🍀 Nested Routes & Layouts

As applications grow, navigation bars, sidebars, headers, and footers
shouldn't be duplicated across every route component. Layout files solve this
by wrapping groups of routes with shared UI, creating a hierarchy of shells
that compose naturally.

A `layout` file wraps all descendant routes within its folder. Creating
`dashboard/layout.tsx` wraps every route under `/dashboard` - including
`/dashboard/settings` and `/dashboard/analytics`.

Nested folders can have their own layouts. These stack outward-in, so a deeply
nested route may pass through several layout wrappers before reaching the page
component itself.

```txt
dashboard/
├── analytics/
│   └── index.tsx       ➜ wrapped by dashboard/layout
├── settings/
│   ├── profile/
│   │   └── index.tsx   ➜ wrapped by dashboard/layout + settings/layout
│   ├── index.tsx       ➜ wrapped by dashboard/layout + settings/layout
│   └── layout.tsx      ➜ wraps all settings/* routes
├── index.tsx           ➜ wrapped by dashboard/layout
└── layout.tsx          ➜ wraps all dashboard/* routes
```

For `/dashboard/settings/profile` the render order is:

1. `dashboard/layout.tsx` (outer)
2. `dashboard/settings/layout.tsx` (inner)
3. `dashboard/settings/profile/index.tsx` (page)

Child routes cannot escape parent layouts. Once a layout is established at a
folder level, all routes beneath it inherit it - keeping the UI hierarchy
predictable.

### 📁 Layout File Naming

Only the lowercase form is recognized as a special file. `Layout.tsx`,
`LAYOUT.vue`, and other variations are treated as regular components.

| Framework | Recognized name |
|-----------|----------------|
| React / SolidJS | `layout.tsx` |
| Vue | `layout.vue` |

Each source folder runs a single framework and ignores files belonging to
others: React/SolidJS folders ignore `.vue` files, Vue folders ignore `.tsx`.

When you create a new layout file, `KosmoJS` generates framework-appropriate
boilerplate immediately. Some editors may require a brief unfocus/refocus to
load the generated content.

### Layout Implementation

Each framework renders child routes differently:

::: code-group

```tsx [React · dashboard/layout.tsx]
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

```tsx [SolidJS · dashboard/layout.tsx]
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

```vue [Vue · dashboard/layout.vue]
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

:::

React renders child routes via `<Outlet />`. SolidJS uses `props.children`.
Vue uses `<RouterView />`.

### Data Loading in Layouts

Layout data loading follows the same per-framework patterns as page components:

::: code-group

```tsx [React · dashboard/layout.tsx]
import { Outlet, useLoaderData } from "react-router";
import fetchClients, { type ResponseT } from "_/front/fetch";

export const loader = fetchClients["dashboard/data"].GET;

export default function Layout() {
  const data = useLoaderData<ResponseT["dashboard/data"]["GET"]>();
  // ...
  return <Outlet />;
}
```

```tsx [SolidJS · dashboard/layout.tsx]
import type { ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";
import fetchClients from "_/front/fetch";

export const preload = fetchClients["dashboard/data"].GET;

const Layout: ParentComponent = (props) => {
  const data = createAsync(preload);
  // ...
  return <>{props.children}</>;
};

export default Layout;
```

```vue [Vue · dashboard/layout.vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import fetchClients, { type ResponseT } from "_/front/fetch";

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

### 🌐 Global Layout via App File

The `App.{tsx,vue}` at the source folder root wraps every route - the right
place for truly global concerns like authentication checks, analytics tracking,
or global error boundaries.

```txt
front/
├── App.tsx              ← wraps everything
└── pages/
    ├── dashboard/
    │   └── layout.tsx
    └── index/
        └── index.tsx
```

### 📊 Layout Hierarchy Example

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

### 💡 Best Practices

- **Keep layouts focused.** Each layout handles concerns for its own scope - dashboard navigation in the dashboard layout, not global auth state.
- **Fetch shared data at the right level.** If multiple child routes need the same data, load it in their common parent layout rather than duplicating the fetch.
- **Use layouts for shared behavior.** Beyond UI structure, layouts suit shared logic: permission checks, analytics, or subscription state scoped to a route group.
- **Avoid deep nesting without purpose.** Three or four levels is reasonable. Beyond that, consider whether the hierarchy reflects genuine UI structure or accidental complexity.
- **Handle loading states explicitly.** Layout data loading can delay rendering - show appropriate fallbacks, especially in Vue where loading is managed manually.

### ⚠️ Common Pitfalls

- **Case sensitivity.** Only `layout.tsx` and `layout.vue` (lowercase) are recognized as layout files.
- **Framework file isolation.** `.vue` files in a React/SolidJS folder are ignored, and `.tsx` files in a Vue folder are ignored.
- **No layout opt-out.** Child routes always inherit parent layouts. Routes that shouldn't share a layout belong in a different directory branch.
- **Data loading differs by framework.** React and SolidJS have built-in route-level data patterns. Vue requires manual lifecycle management.
