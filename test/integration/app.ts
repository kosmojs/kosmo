import type { FRAMEWORKS } from "@kosmojs/core";

// Filename of the root App wrapper per framework.
// App wraps every route, so overwriting it here covers pages produced by the
// harness templateFactory, by the generator default template, and by the
// generator `templates` config alike.
export const APP_FILE: Record<keyof typeof FRAMEWORKS, string> = {
  react: "App.tsx",
  solid: "App.tsx",
  vue: "App.vue",
  svelte: "App.svelte",
  mdx: "App.mdx",
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

export default function App() {
  useEffect(() => {
    window.__APP_RENDERED__ = true;
  }, []);

  return <Outlet />;
}
`.trimStart(),

  solid: `
import { onMount, type ParentComponent } from "solid-js";

export default function App(props) {
  onMount(() => {
    window.__APP_RENDERED__ = true;
  });

  return props.children;
};
`.trimStart(),

  vue: `
<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  window.__APP_RENDERED__ = true;
});
</script>

<template>
  <RouterView />
</template>
`.trimStart(),

  svelte: `
<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  $effect(() => {
    window.__APP_RENDERED__ = true;
  });
</script>

{@render children()}
`.trimStart(),

  mdx: `
import { useEffect } from "preact/hooks";

export const RenderingProbe = () => {
  useEffect(() => {
    window.__APP_RENDERED__ = true;
  }, []);
  return null;
};

<RenderingProbe />

{props.children}
`.trimStart(),
};
