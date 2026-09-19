<!-- #region react -->
```tsx
// React: app.tsx
import { Outlet } from "react-router";
import { AppProvider } from "_/app";

export default function App() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
```
<!-- #endregion react -->

<!-- #region solid -->
```tsx
// Solid: app.tsx
import type { ParentComponent } from "solid-js";
import { AppProvider } from "_/app";

const app: ParentComponent = (props) => {
  return <AppProvider>{props.children}</AppProvider>;
};

export default app;
```
<!-- #endregion solid -->

<!-- #region vue -->
```vue
<!-- Vue: app.vue -->
<script setup lang="ts">
import { AppProvider } from "_/app";
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
```
<!-- #endregion vue -->

<!-- #region svelte -->
```svelte
<!-- Svelte: app.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { AppProvider } from "_/app";
  let { children }: { children: Snippet } = $props();
</script>

<AppProvider>
  {@render children()}
</AppProvider>
```
<!-- #endregion svelte -->

<!-- #region mdx -->
```mdx
{/* MDX: app.mdx */}
import { AppProvider } from "_/app";

<AppProvider>{props.children}</AppProvider>
```
<!-- #endregion mdx -->
