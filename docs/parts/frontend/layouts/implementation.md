<!-- #region react -->
// React: pages/dashboard/layout.tsx
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
<!-- #endregion react -->

<!-- #region solid -->
// Solid: pages/dashboard/layout.tsx
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
<!-- #endregion solid -->

<!-- #region vue -->
<!-- Vue: pages/dashboard/layout.vue -->
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
<!-- #endregion vue -->

<!-- #region svelte -->
<!-- Svelte: pages/dashboard/layout.svelte -->
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
<!-- #endregion svelte -->

<!-- #region mdx -->
{/* MDX: pages/docs/layout.mdx */}
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
<!-- #endregion mdx -->
