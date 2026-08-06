import type { FRAMEWORKS } from "@kosmojs/core";

// Filename of the root app wrapper per framework.
// The app wraps every route and composes AppProvider from _/app,
// so overwriting it here covers pages produced by the harness templateFactory,
// by the generator default template, and by the generator `templates` config alike.
export const APP_FILE: Record<keyof typeof FRAMEWORKS, string> = {
  react: "app.tsx",
  solid: "app.tsx",
  vue: "app.vue",
  svelte: "app.svelte",
  mdx: "app.mdx",
};

// Each probe sets window.__APP_RENDERED__ from a mount/effect callback, which
// can only run once the client runtime has taken over. A page that is merely
// server-rendered - correct markup, dead root - never sets it.
// A window property is used rather than a DOM attribute so the probe cannot
// leak into page.content() assertions or committed snapshots.
export const appMap: Record<keyof typeof FRAMEWORKS, string> = {
  react: `
import { useEffect } from "react";
import { Outlet } from "react-router";
import { AppProvider } from "_/app";

export default function app() {
  useEffect(() => {
    window.__APP_RENDERED__ = true;
  }, []);

  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
`.trimStart(),

  solid: `
import { onMount, type ParentComponent } from "solid-js";
import { AppProvider } from "_/app";

const app: ParentComponent = (props) => {
  onMount(() => {
    window.__APP_RENDERED__ = true;
  });

  return <AppProvider>{props.children}</AppProvider>;
};

export default app;
`.trimStart(),

  vue: `
<script setup lang="ts">
import { onMounted } from "vue";
import { AppProvider } from "_/app";

onMounted(() => {
  window.__APP_RENDERED__ = true;
});
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
`.trimStart(),

  svelte: `
<script lang="ts">
  import { AppProvider } from "_/app";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  $effect(() => {
    window.__APP_RENDERED__ = true;
  });
</script>

<AppProvider>
  {@render children()}
</AppProvider>
`.trimStart(),

  mdx: `
import { useEffect } from "preact/hooks";
import { AppProvider } from "_/app";

export const RenderingProbe = () => {
  useEffect(() => {
    window.__APP_RENDERED__ = true;
  }, []);
  return null;
};

<RenderingProbe />

<AppProvider>{props.children}</AppProvider>
`.trimStart(),
};
