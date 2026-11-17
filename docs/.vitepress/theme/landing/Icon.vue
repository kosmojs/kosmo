<script setup lang="ts">
import { computed } from "vue";

/*
  The landing's glyph set: 24px stroke icons, drawn in currentColor so a
  parent decides the hue. Static markup only - nothing user-supplied ever
  reaches v-html here.
*/
const glyphs: Record<string, string> = {
  arrow: [`<path d="M5 12h14"/>`, `<path d="m13 6 6 6-6 6"/>`].join(""),
  external: [`<path d="M7 17 17 7"/>`, `<path d="M8 7h9v9"/>`].join(""),
  check: [`<path d="m5 12.5 4.5 4.5L19 7.5"/>`].join(""),
  copy: [
    `<rect x="9" y="9" width="12" height="12" rx="2"/>`,
    `<path d="M5 15V5a2 2 0 0 1 2-2h10"/>`,
  ].join(""),
  link: [
    `<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/>`,
    `<path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>`,
  ].join(""),
  services: [
    `<rect x="2.5" y="3" width="7" height="7" rx="1.5"/>`,
    `<rect x="14.5" y="3" width="7" height="7" rx="1.5"/>`,
    `<rect x="8.5" y="14" width="7" height="7" rx="1.5"/>`,
    `<path d="M9.5 6.5h1.5M13 6.5h1.5M6 10v1.5M18 10v1.5" stroke-dasharray="1.5 2"/>`,
  ].join(""),
  monorepo: [
    `<rect x="2.5" y="2.5" width="19" height="19" rx="2.5"/>`,
    `<rect x="6" y="6" width="5" height="5" rx="1"/>`,
    `<rect x="13" y="6" width="5" height="5" rx="1"/>`,
    `<rect x="6" y="13" width="12" height="5" rx="1"/>`,
  ].join(""),
  glue: [
    `<circle cx="4.5" cy="18" r="2"/>`,
    `<circle cx="19.5" cy="6" r="2"/>`,
    `<path d="M6.5 18c3 0 2-6 5-6s2 3 3.5 1 1-5 2.5-6"/>`,
  ].join(""),
  tree: [
    `<path d="M4 3v15a2 2 0 0 0 2 2h3"/>`,
    `<path d="M4 8h5"/>`,
    `<path d="M4 14h5"/>`,
    `<rect x="11" y="5" width="9" height="6" rx="1.5"/>`,
    `<rect x="11" y="13" width="9" height="6" rx="1.5"/>`,
  ].join(""),
  shield: [
    `<path d="M12 2.5 4.5 5.5v6c0 5 3.3 8.3 7.5 10 4.2-1.7 7.5-5 7.5-10v-6z"/>`,
    `<path d="m8.8 12 2.2 2.2 4.3-4.4"/>`,
  ].join(""),
  swap: [
    `<path d="M4 8h15"/>`,
    `<path d="m15 4 4 4-4 4"/>`,
    `<path d="M20 16H5"/>`,
    `<path d="m9 12-4 4 4 4"/>`,
  ].join(""),
  stream: [
    `<path d="M3 6h18"/>`,
    `<path d="M3 12h11"/>`,
    `<path d="M3 18h5"/>`,
    `<circle cx="18" cy="12" r="1"/>`,
    `<circle cx="12" cy="18" r="1"/>`,
    `<circle cx="17" cy="18" r="1"/>`,
  ].join(""),
  layers: [
    `<path d="m12 2.5 9.5 4.8-9.5 4.8-9.5-4.8z"/>`,
    `<path d="m2.5 12 9.5 4.8 9.5-4.8"/>`,
    `<path d="m2.5 16.7 9.5 4.8 9.5-4.8"/>`,
  ].join(""),
  query: [
    `<path d="M20.5 12A8.5 8.5 0 1 1 18 6L20.5 8.5"/>`,
    `<path d="M20.5 3.5v5h-5"/>`,
    `<path d="M12 8v4l2.5 2.5"/>`,
  ].join(""),
  layout: [
    `<rect x="2.5" y="3" width="19" height="18" rx="2.5"/>`,
    `<path d="M2.5 9h19"/>`,
    `<path d="M9 9v12"/>`,
    `<rect x="12" y="12" width="6.5" height="6" rx="1"/>`,
  ].join(""),
  cube: [
    `<path d="M21 16.2V7.8L12 2.7 3 7.8v8.4l9 5.1z"/>`,
    `<path d="m3.3 7.6 8.7 5 8.7-5"/>`,
    `<path d="M12 22v-9.4"/>`,
  ].join(""),
  folder: [
    `<path d="` +
      `M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v9.5a1.5 ` +
      `1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z` +
      `"/>`,
  ].join(""),
  github: [
    `<path fill="currentColor" stroke="none" d="` +
      `M12 .5a11.5 11.5 0 0 0-3.64 ` +
      `22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37` +
      `-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 ` +
      `1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 ` +
      `3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.68 ` +
      `0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 ` +
      `3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 ` +
      `1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 ` +
      `5.38-5.27 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 ` +
      `11.5 0 0 0 12 .5` +
      `"/>`,
  ].join(""),
};

const props = defineProps<{ name: string }>();

const inner = computed(() => glyphs[props.name] ?? "");
</script>

<template>
  <svg
    class="kx-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="inner"
  />
</template>
