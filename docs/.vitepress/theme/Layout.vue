<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { watchEffect } from "vue";

import KosmoMark from "./components/KosmoMark.vue";

const { Layout: DefaultLayout } = DefaultTheme;
const { frontmatter } = useData();

watchEffect(() => {
  if (typeof document === "undefined") {
    return;
  }
  const title = frontmatter.value.title;
  const root = document.documentElement;
  if (title) {
    root.style.setProperty("--vp-page-title", JSON.stringify(`${title} · `));
  } else {
    root.style.removeProperty("--vp-page-title");
  }
});
</script>

<template>
  <DefaultLayout>
    <!--
      The mark goes in through the slot rather than themeConfig.logo: that path
      renders an <img>, which cuts the artwork off from currentColor and from
      the accent variable, so it could not follow the color scheme.
    -->
    <template #nav-bar-title-before>
      <KosmoMark />
    </template>
    <template #aside-outline-before>
      <!-- Render the title only if it exists in frontmatter -->
      <div v-if="frontmatter.title" class="page-title-aside">
        {{ frontmatter.title }}
      </div>
    </template>
  </DefaultLayout>
</template>

<style scoped>
.page-title-aside {
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
}
</style>
