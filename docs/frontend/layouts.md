---
title: Nested Layouts
description: Compose shared UI at any level of the route hierarchy using layout files.
    Navigation, sidebars, auth shells, and data loading scoped to route subtrees
    for React, SolidJS, Vue, Svelte and MDX applications.
head:
  - - meta
    - name: keywords
      content: nested layouts, layout components, route hierarchy, shared ui,
        react outlet, vue router view, solidjs children, svelte layouts, mdx layouts,
        layout data loading, kosmojs layouts
---

Layout files wrap groups of routes with shared UI - without duplicating
components across every page.

## Define a Layout

Create a `layout.tsx` (or `.vue` / `.svelte` / `.mdx`) in any folder under `pages/`,
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

## Layout File Naming

Only the lowercase form is recognized as a special file. `Layout.tsx`,
`LAYOUT.vue`, and other variations are treated as regular components.

| Framework | Recognized name |
|-----------|----------------|
| React / SolidJS | `layout.tsx` |
| Vue | `layout.vue` |
| Svelte | `layout.svelte` |
| MDX | `layout.mdx` |

Each source folder runs a single framework and ignores files belonging to
others: React/SolidJS folders ignore `.vue`/`.svelte` files, Vue folders ignore `.tsx`.

When you create a new layout file, `KosmoJS` generates framework-appropriate
boilerplate immediately. Some editors may require a brief unfocus/refocus to
load the generated content.

## Layout Implementation

Each framework renders child routes differently:

::: code-group

```tsx [React]
// layout.tsx
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

```tsx [SolidJS]
// layout.tsx
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

```vue [Vue]
// layout.vue
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

```svelte [Svelte]
// layout.svelte
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

```mdx [MDX]
// layout.mdx
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

React renders child routes via `<Outlet />`. SolidJS and MDX use `props.children`,
Svelte renders `{@render children()}`, and Vue uses `<RouterView />`.

## Data Loading in Layouts

Layout data loading follows the same per-framework patterns as page components,
but how a layout's data stays distinct from its child page's differs:

- **React** scopes structurally - each route (layouts included) owns its `loader`,
    and `useLoaderData()` returns the calling route's data.
    No key; the route tree carries the identity.
- **SolidJS** keys by the `query()` cache string you supply (`"dashboard/data"` here),
    so the key lives in the `query()` wrapper, not the hook read.
- **Vue, Svelte, and MDX** share one per-route store keyed by route name, so the layout
  passes its path-qualified name to `useLoaderData` (a page passes nothing) -
  the hook can't tell which layout it runs in.

::: code-group

```tsx [React]
// layout.tsx
import { Outlet, useLoaderData } from "react-router";
import fetchClients, { type ResponseT } from "_/fetch";

export const loader = fetchClients["dashboard/data"].GET;

type T = ResponseT["dashboard/data"]["GET"];

export default function Layout() {
  const data = useLoaderData<T>();
  // ...
  return <Outlet />;
}
```

```tsx [SolidJS]
// layout.tsx
import { Suspense, type ParentComponent } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["dashboard/data"];

// wrap in query() so preload and createAsync share one cache key
const getData = query(() => GET(), "dashboard/data");

export const preload = () => getData();

const Layout: ParentComponent = (props) => {
  const data = createAsync(() => getData());
  // ...
  return <Suspense>{props.children}</Suspense>;
};

export default Layout;
```

```vue [Vue]
// layout.vue
<script lang="ts">
import fetchClients from "_/fetch";

// loader export lives in a plain <script> block
export const loader = fetchClients["dashboard/data"].GET;
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";
import { type ResponseT } from "_/fetch";

type T = ResponseT["dashboard/data"]["GET"];

// a layout passes its path-qualified name to read its own data
const data = useLoaderData<T>("dashboard/layout");
</script>

<template>
  ...
</template>
```

```svelte [Svelte]
// layout.svelte
<script module lang="ts">
import fetchClients from "_/fetch";

// loader export lives in the module <script> block
export const loader = fetchClients["dashboard/data"].GET;
</script>

<script lang="ts">
import { useLoaderData } from "_/use";
import type { ResponseT } from "_/fetch";

let { children } = $props();

type T = ResponseT["dashboard/data"]["GET"];

// a layout passes its path-qualified name to read its own data
const data = useLoaderData<T>("dashboard/layout");
</script>

<nav>{data.title}</nav>
<main>
  {@render children()}
</main>
```

```mdx [MDX]
// layout.mdx
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

export const loader = fetchClients["dashboard/data"].GET;

export const Nav = () => {
  // a layout passes its path-qualified name to read its own data
  const data = useLoaderData("dashboard/layout");
  return <nav>{data.title}</nav>;
};

<Nav />
<main>
  {props.children}
</main>
```
:::

Across all frameworks the loader/preload runs before the layout renders,
so its data is available immediately and shared across every child route
without a duplicate fetch. The read is a hook (`useLoaderData` / `createAsync`)
rather than a prop - `props` carries only `children`/`<Outlet />`. Keeping a
layout's data distinct from its page's is automatic in React (per-route) and
Solid (via the `query()` key); in Vue, Svelte, and MDX you pass the layout's
path-qualified name (e.g. `"dashboard/layout"` for `pages/dashboard/layout.*`)
to the hook.

## Global Layout via App File

The `App.{tsx,vue,svelte,mdx}` at the source folder root wraps every route - the right
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

## Layout Hierarchy Example

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

## Best Practices

- **Keep layouts focused.** Each layout handles concerns for its own scope - dashboard navigation in the dashboard layout, not global auth state.
- **Fetch shared data at the right level.** If multiple child routes need the same data, load it in their common parent layout rather than duplicating the fetch.
- **Use layouts for shared behavior.** Beyond UI structure, layouts suit shared logic: permission checks, analytics, or subscription state scoped to a route group.
- **Avoid deep nesting without purpose.** Three or four levels is reasonable. Beyond that, consider whether the hierarchy reflects genuine UI structure or accidental complexity.
- **Handle loading states explicitly.** Loader/preload data resolves before render, but a `createAsync` read that suspends (SolidJS) still wants a `<Suspense>` fallback scoped to the data component - see the data-preload guide.

## Common Pitfalls

- **Case sensitivity.** Only `layout.{tsx,vue,svelte,mdx}` are recognized as layout files.
- **Framework file isolation.** `.vue`/`.svelte` files in a React/SolidJS/MDX folder are ignored, and `.tsx/.mdx` files in a Vue/Svelte folder are ignored.
- **No layout opt-out.** Child routes always inherit parent layouts. Routes that shouldn't share a layout belong in a different directory branch.
- **Data loading uses hooks, not props.** All frameworks load layout data through a `loader`/`preload` export read with a hook (`useLoaderData`/`createAsync`).
Keeping a layout's data separate from its page's is automatic in React (per-route) and Solid (via the `query()` key);
in Vue, Svelte, and MDX the layout passes its path-qualified name to `useLoaderData` (a page passes nothing).
