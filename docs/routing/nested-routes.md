---
title: Nested Routes & Layouts
description: Organize complex UIs with nested routes and layout components.
    KosmoJS supports layout.{tsx,vue} files that wrap descendant routes
    with framework-specific outlet patterns and data loading integration.
head:
  - - meta
    - name: keywords
      content: nested routes, layout components, route hierarchy, outlet pattern,
        router view, data loading, react router, solidjs router, vue router
---

As applications grow, you need ways to share UI structure across related pages.
Navigation bars, sidebars, headers, and footers shouldn't be duplicated in every route component.

Layout files solve this by wrapping groups of routes with common UI elements.

`KosmoJS` supports nested layouts through `layout.{tsx,vue}` files
that work consistently across `React`, `SolidJS`, and `Vue`.

Each layout wraps all routes within its folder and any nested folders,
creating a hierarchy of UI shells that compose naturally.

## 🎨 How Layouts Work

A layout file wraps all descendant routes in its folder hierarchy.
When you create `dashboard/layout.tsx`, it wraps every route that starts with `/dashboard` -
including nested routes like `/dashboard/settings` or `/dashboard/analytics`.

If a nested folder also has a layout, the layouts stack.
A route deep in your hierarchy might be wrapped by several layouts, each adding its own layer of UI structure.

```txt
dashboard/
├── analytics/
│   └── index.tsx       🢂 Wrapped by dashboard/layout
├── settings/
│   ├── profile/
│   │   └── index.tsx   🢂 Wrapped by dashboard/layout + settings/layout
│   ├── index.tsx       🢂 Wrapped by dashboard/layout + settings/layout
│   └── layout.tsx      🢂 Wraps all settings/* routes
├── index.tsx           🢂 Wrapped by dashboard/layout
└── layout.tsx          🢂 Wraps all dashboard/* routes
```

In this structure, `/dashboard/settings/profile` gets wrapped by two layouts:
1. `dashboard/layout.tsx` (outer)
2. `dashboard/settings/layout.tsx` (inner)
3. Finally renders `dashboard/settings/profile/index.tsx`

There's no way for child routes to "escape" parent layouts.
Once a layout is established at a folder level, all routes beneath it inherit that wrapper.

This constraint ensures your UI hierarchy stays predictable and prevents confusing exceptions.

## 📁 Layout File Requirements

Layout files follow the same naming rules as route files:

**Reserved names (case-sensitive):**
- `layout.tsx` for React/SolidJS ✅
- `layout.vue` for Vue ✅

**Not recognized:**
- `Layout.tsx` (capitalized) ❌
- `LAYOUT.tsx` (uppercase) ❌
- Any other variation ❌

Just like with `index` files, only the lowercase version is recognized as a special file.
You can use capitalized versions for regular components without causing conflicts.

Each source folder runs its own framework and only recognizes files matching that framework's convention.
A React/SolidJS source folder ignores `.vue` files, and a Vue source folder ignores `.tsx` files.

When you create a new layout file, `KosmoJS` instantly generates framework-specific boilerplate.
Depending on your editor, this content may appear immediately or after briefly unfocusing and refocusing the file to load the new content.

## ⚛️ React Layouts

React layouts use the `<Outlet />` component from React Router to render child routes.

```tsx [dashboard/layout.tsx]
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

The `<Outlet />` component is where child routes render.
For `/dashboard/settings`, the outlet renders the settings route.
For `/dashboard/analytics`, it renders the analytics route.
The surrounding structure - the nav and footer - stays consistent across all dashboard pages.

### Data Loading in React Layouts

React layouts support the loader pattern, just like route files.
Export a `loader` function that fetches data, and access it in your component with `useLoaderData()`.

```tsx [dashboard/settings/layout.tsx]
import { Outlet, useLoaderData } from "react-router";

import { GET as loader, type ResponseT } from "@src/{api}/dashboard/data/fetch";

export { loader };

export default function Layout() {
  const data = useLoaderData<ResponseT["GET"]>();
  // ...
}
```

The loader runs before the layout renders, ensuring data is available immediately.
All child routes within `dashboard/settings/` can access this data through their parent layout, reducing duplicate data fetching.

For more details on React Router's loader pattern, see the [React Router documentation](https://reactrouter.com/start/data/data-loading).

## 🔷 SolidJS Layouts

SolidJS layouts receive child routes through `props.children`, following SolidJS's natural composition model.

```tsx [dashboard/layout.tsx]
import { ParentComponent } from "solid-js";

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

Unlike React's explicit `<Outlet />`, SolidJS uses the props children pattern.
Child routes are passed as `props.children` and render wherever you place that expression.

### Data Loading in SolidJS Layouts

SolidJS layouts support the preload pattern integrated with SolidJS Router.
Export a `preload` function that returns a promise, and use `createAsync` to access the data in your component.


```tsx [dashboard/settings/layout.tsx]
import { ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";

import { GET as preload, type ResponseT } from "@src/{api}/dashboard/data/fetch";

export { preload };

const Layout: ParentComponent = (props) => {
  const data = createAsync(preload);
  // ...
};

export default Layout;
```

The `preload` export tells the router to fetch data before rendering.
`createAsync` recognizes the same function and reuses the fetched data, preventing duplicate requests.

This pattern integrates seamlessly with `KosmoJS`'s generated fetch clients.
You can import the typed fetch function from your API route and use it as both the preload function and the createAsync source.

For more on SolidJS Router's data loading patterns, see the [SolidJS Router documentation](https://docs.solidjs.com/solid-router/reference/data-apis/create-async).

## 💎 Vue Layouts

Vue layouts use `<router-view />` to render child routes, following Vue Router conventions.

```vue [dashboard/layout.vue]
<script setup lang="ts">
// Layout-specific logic
</script>

<template>
  <div class="dashboard">
    <nav>...</nav>

    <main>
      <router-view />
    </main>

    <footer>...</footer>
  </div>
</template>
```

The `<router-view />` component marks where child routes render.
Vue Router handles the routing logic, and your layout provides the surrounding UI structure.

### Data Loading in Vue Layouts

Vue doesn't have a built-in loader pattern at the router level like React or SolidJS.
Instead, you use Vue's lifecycle hooks to fetch data when the component mounts or when route parameters change.

```vue [dashboard/settings/layout.vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";

import { GET, type ResponseT } from "@src/{api}/dashboard/data/fetch";

const data = ref<ResponseT["GET"] | null>(null);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    data.value = await GET();
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

This approach gives you full control over when and how data loads.
You can use `onMounted` for initial data, watch route parameters for updates,
or integrate with Vue Router's navigation guards for more advanced scenarios.

For more on Vue Router navigation guards and data fetching patterns, see the [Vue Router documentation](https://router.vuejs.org/guide/advanced/data-fetching.html).

## 🌐 Global Layouts with App Files

Sometimes you need a layout that wraps every single route in your application -
perhaps for analytics tracking, global error boundaries, or authentication checks.

The `App.{tsx,vue}` file at the root of your source folder serves this purpose.
It's the application entry point and wraps all routes, providing a place for truly global concerns.

```txt
src/
├── api/
├── pages/
│   ├── dashboard/
│   │   └── layout.tsx
│   └── index/
│       └── index.tsx
└── App.tsx              🢀 Wraps everything
```

The `App` file sits at the top of your layout hierarchy.
Every route, including those with their own layouts, renders within the `App` wrapper.

## 📊 Complete Hierarchy Example

Here's how layouts stack for a deeply nested route:

```txt
@src/
├── App.tsx                        🢀 Level 1: Global wrapper
└── pages/
    └── dashboard/
        ├── layout.tsx             🢀 Level 2: Dashboard wrapper
        └── settings/
            ├── layout.tsx         🢀 Level 3: Settings wrapper
            └── security/
                ├── layout.tsx     🢀 Level 4: Security wrapper
                └── index.tsx      🢀 Level 5: Final component
```

When a user visits `/dashboard/settings/security`, the rendering hierarchy is:

```
App (global concerns)
└── Dashboard Layout (dashboard navigation)
    └── Settings Layout (settings sidebar)
        └── Security Layout (security tabs)
            └── Security Page (actual content)
```

Each layout adds its layer of UI structure. The inner layouts have access to everything outer layouts provide,
creating a natural flow of context and shared state.

## 💡 Best Practices

**Keep layouts focused:** Each layout should provide UI elements relevant to its scope.
The dashboard layout handles dashboard-wide navigation, not global authentication state.

**Consider data dependencies:** If multiple child routes need the same data,
load it in a parent layout rather than repeating the fetch in each child.

**Use layouts for shared behavior:** Beyond UI, layouts are perfect for shared logic like analytics tracking,
permission checks, or subscription state management that applies to a group of routes.

**Avoid deep nesting without purpose:** Three or four levels of layouts is reasonable.
Beyond that, consider whether you're creating unnecessary hierarchy.

**Leverage typed fetch clients:** When loading data in React or SolidJS layouts,
use `KosmoJS`'s generated fetch clients for end-to-end type safety from your API to your UI.

**Handle loading states gracefully:** Layout data loading can delay rendering.
Show appropriate loading states rather than flashing empty content, especially in Vue where you manage loading manually.

## ⚠️ Common Pitfalls

**Case sensitivity matters:** Only `layout.tsx` and `layout.vue` (lowercase) are recognized.
`Layout.tsx` or `LAYOUT.vue` won't work as layout files.

**Framework files are ignored across boundaries:** `.vue` files in a React/SolidJS source folder are ignored,
and `.tsx` files in a Vue folder are ignored. Each source folder sticks to its configured framework.

**You cannot skip parent layouts:** If a parent folder has a layout, all child routes inherit it.
There's no opt-out mechanism. If you need routes that don't share a layout,
they belong in a different part of your directory structure.

**Auto-generated boilerplate may require editor refocus:** When you create a new layout file,
`KosmoJS` generates boilerplate content. Some editors loads generated content immediately,
others may require you to briefly unfocus and refocus the editor to load the new content.

**Layout data loading differs by framework:** React and SolidJS have built-in patterns for layout data loading.
Vue requires manual lifecycle management. Don't expect the same API across frameworks.

---

Layouts transform route organization from a flat list of pages into a hierarchical structure
that mirrors your UI architecture. By establishing clear boundaries and shared concerns at each level,
you build applications that scale naturally as complexity grows.
