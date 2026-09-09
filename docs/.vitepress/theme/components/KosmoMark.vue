<script setup lang="ts">
import { computed, useId } from "vue";

import mark from "../assets/kosmo-mark.svg?raw";

const props = withDefaults(
  defineProps<{
    // rendered box in px; the artwork is square and ink-tight inside it
    size?: number;
    // set when the mark stands alone, with no wordmark beside it
    label?: string;
  }>(),
  { size: 32, label: "" },
);

const box = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

/*
  The artwork names its gradients "g-frame" and "g-rocket". Two marks on one
  page - header and footer - would collide, and every reference would resolve
  to whichever landed in the DOM first, so each instance rewrites them to its
  own id.
*/
const uid = useId();

const svg = computed(() =>
  mark.replace(/(id="|url\(#)g-/g, (_, lead: string) => `${lead}${uid}-`),
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
