<!-- #region react -->
```tsx [pages/dashboard/layout.tsx]
// React: pages/dashboard/layout.tsx
import { Outlet, useLoaderData } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["dashboard/data"];

export const loader = () => GET();

export default function Layout() {
  const data = useLoaderData();
  // ...
  return <Outlet />;
}
```
<!-- #endregion react -->

<!-- #region solid -->
```tsx [pages/dashboard/layout.tsx]
// Solid: pages/dashboard/layout.tsx
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
<!-- #endregion solid -->

<!-- #region vue -->
```vue [pages/dashboard/layout.vue]
<!-- Vue: pages/dashboard/layout.vue -->
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["dashboard/data"];

// loader export lives in a plain <script> block
export const loader = () => GET();
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

// a layout passes its path-qualified name to read its own data
const data = useLoaderData("dashboard/layout");
</script>

<template>
  ...
</template>
```
<!-- #endregion vue -->

<!-- #region svelte -->
```svelte [pages/dashboard/layout.svelte]
<!-- Svelte: pages/dashboard/layout.svelte -->
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["dashboard/data"];

// loader export lives in the module <script> block
export const loader = () => GET();
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

let { children } = $props();

// a layout passes its path-qualified name to read its own data
const data = useLoaderData("dashboard/layout");
</script>

<nav>{data.title}</nav>
<main>
  {@render children()}
</main>
```
<!-- #endregion svelte -->

<!-- #region mdx -->
```mdx [pages/dashboard/layout.mdx]
{/* MDX: pages/dashboard/layout.mdx */}
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

export const { GET } = fetchClients["dashboard/data"];

export const loader = () => GET();

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
<!-- #endregion mdx -->
