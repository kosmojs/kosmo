<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import KosmoMark from "./components/KosmoMark.vue";

const { Layout: DefaultLayout } = DefaultTheme;
</script>

<template>
  <DefaultLayout>
    <!--
      The mark goes in through the slot rather than themeConfig.logo: that path
      renders an <img>, which cuts the artwork off from currentColor and from
      the accent variable, so it could not follow the color scheme.
    -->
    <template #nav-bar-title-before>
      <KosmoMark :size="30" />
    </template>
  </DefaultLayout>
</template>
