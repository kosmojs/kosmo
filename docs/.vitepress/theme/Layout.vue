<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";

import DocHeader from "./components/DocHeader.vue";
import KosmoMark from "./components/KosmoMark.vue";

const { Layout: DefaultLayout } = DefaultTheme;
const { frontmatter } = useData();
const route = useRoute();

watchEffect(() => {
  if (typeof document === "undefined") {
    return;
  }
  const title = frontmatter.value.title;
  const root = document.documentElement;
  /*
    The title and its separator are separate values, so the local nav can cut
    a long title with an ellipsis and still show the separator after it.
  */
  if (title) {
    root.style.setProperty("--vp-page-title", JSON.stringify(title));
    root.style.setProperty("--vp-page-title-sep", JSON.stringify(" \u00b7 "));
  } else {
    root.style.removeProperty("--vp-page-title");
    root.style.removeProperty("--vp-page-title-sep");
  }
});

/*
  Reading progress, for doc pages only. The bar is a single fixed element
  scaled along X, so a scroll costs one style write and no layout.

  It rides the bottom edge of whichever bar is on screen. On a desktop that
  is the fixed nav. Below 960px the nav scrolls away and the local nav
  (menu and outline toggles) sticks to the top in its place, so the edge
  moves as the page scrolls. Measuring both on every frame keeps the line
  glued to whichever edge is lowest.
*/
const isDoc = computed(() => {
  const layout = frontmatter.value.layout;
  return layout === undefined || layout === "doc";
});

const progress = ref<HTMLElement | null>(null);
let frame = 0;

const edgeOf = (selector: string) => {
  const bar = document.querySelector(selector);
  return bar ? bar.getBoundingClientRect().bottom : 0;
};

const measure = () => {
  frame = 0;
  const el = progress.value;
  if (!el) {
    return;
  }
  const edge = Math.max(0, edgeOf(".VPNav"), edgeOf(".VPLocalNav"));
  el.style.top = `${Math.round(edge)}px`;
  const span = document.documentElement.scrollHeight - window.innerHeight;
  const read = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
  el.style.setProperty("--kx-read", read.toFixed(4));
};

const schedule = () => {
  if (!frame) {
    frame = requestAnimationFrame(measure);
  }
};

onMounted(() => {
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) {
    cancelAnimationFrame(frame);
  }
});

// a client-side navigation swaps the content without a scroll event
watch(
  () => route.path,
  () => {
    if (typeof window !== "undefined") {
      setTimeout(schedule, 60);
    }
  },
);
</script>

<template>
  <DefaultLayout>
    <!--
      The mark goes in through the slot rather than themeConfig.logo: that path
      renders an <img>, which cuts the artwork off from currentColor and from
      the accent variable, so it could not follow the color scheme.
    -->
    <template #nav-bar-title-before>
      <KosmoMark :size="26" />
    </template>
    <template #doc-before>
      <DocHeader />
    </template>
    <template #layout-bottom>
      <div v-if="isDoc" ref="progress" class="kx-progress" aria-hidden="true" />
    </template>
  </DefaultLayout>
</template>
