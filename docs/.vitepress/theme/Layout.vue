<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { computed, watchEffect } from "vue";

import KosmoMark from "./components/KosmoMark.vue";

const { Layout: DefaultLayout } = DefaultTheme;
const { frontmatter, lang } = useData();

const formattedDate = computed(() => {
  const raw = frontmatter.value.date;

  if (!raw) {
    return "";
  }

  const d = new Date(raw);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString(lang.value || "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const isoDate = computed(() => {
  const raw = frontmatter.value.date;

  if (!raw) {
    return "";
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
});

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
      <KosmoMark :size="28" />
    </template>
    <template #aside-outline-before>
      <!-- Render the date only if it exists in frontmatter -->
      <time v-if="formattedDate" :datetime="isoDate" class="text-muted">
        {{ formattedDate }}
      </time>
      <!-- Render the title only if it exists in frontmatter -->
      <div v-if="frontmatter.title" class="page-title-aside">
        <div>
          {{ frontmatter.title }}
        </div>
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
