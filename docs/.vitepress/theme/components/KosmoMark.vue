<script setup lang="ts">
import { computed, useId } from "vue";

import markMicro from "../assets/kosmo-mark-micro.svg?raw";
import mark from "../assets/kosmo-mark.svg?raw";

const props = withDefaults(
  defineProps<{
    // rendered box in px; the artwork is square and ink-tight inside it
    size?: number;
    // set when the mark stands alone, with no wordmark beside it
    label?: string;
  }>(),
  { size: 30, label: "" },
);

/*
  One drawing, two cuts.

  The artwork is solid shapes rather than hairlines, so it holds its own down
  to about nav size with no help. What does not survive are the three detached
  slivers - two corner ticks and the short trail streak - and the porthole:
  each is roughly 11 units in a 120-unit box, so below 24px they land under a
  pixel and turn into grit around the frame. The micro cut drops exactly those
  four and keeps the silhouette.
* */
const MICRO_BELOW = 24;

const isMicro = computed(() => props.size < MICRO_BELOW);

const box = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

/*
  Both cuts name their gradients "g-frame" and "g-rocket". Two marks on one
  page - header and footer - would collide, and every reference would resolve
  to whichever landed in the DOM first, so each instance rewrites them to its
  own id.
* */
const uid = useId();

const svg = computed(() =>
  (isMicro.value ? markMicro : mark).replace(
    /(id="|url\(#)g-/g,
    (_, lead: string) => `${lead}${uid}-`,
  ),
);
</script>

<template>
  <span
    class="kosmo-mark"
    :style="box"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    v-html="svg"
  />
</template>

<style scoped>
.kosmo-mark {
  display: inline-block;
  flex: none;
  line-height: 0;
}

.kosmo-mark :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
