<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import Landing from "./Landing.vue";

const { Layout: DefaultLayout } = DefaultTheme;
const { frontmatter } = useData();
</script>

<template>
  <Landing v-if="frontmatter.landing" />
  <DefaultLayout v-else />
</template>
