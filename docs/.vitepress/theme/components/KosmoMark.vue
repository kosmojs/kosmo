<script setup lang="ts">
import { computed, useId } from "vue";

import mark16 from "../assets/kosmo-mark-16.svg?raw";
import mark24 from "../assets/kosmo-mark-24.svg?raw";
import mark from "../assets/kosmo-mark.svg?raw";

const props = withDefaults(
  defineProps<{
    // rendered box in px; the orbit reads at roughly two thirds of it
    size?: number;
    // set when the mark stands alone, with no wordmark beside it
    label?: string;
  }>(),
  { size: 30, label: "" },
);

/*
  The three optical cuts.

  Stroke weight is baked into each file rather than scaled, so the cut has to
  match the rendered size: below ~18px only the heaviest one survives, and the
  master is drawn for display sizes where a 3-unit stroke still reads.

  `left` and `right` are the empty margins inside the 120-unit viewBox, stroke
  included. They are not equal: the satellite pushes the artwork off-centre,
  so the mark carries more air on its left than on its right. Left untrimmed,
  a lockup sits visibly indented and its gap to the wordmark opens up too far.
*/
const cuts = [
  { max: 18, src: mark16, left: 18, right: 11.1 },
  { max: 32, src: mark24, left: 19.25, right: 12.4 },
  { max: Infinity, src: mark, left: 20.5, right: 13.4 },
];

const cut = computed(
  () => cuts.find((c) => props.size <= c.max) ?? cuts[cuts.length - 1],
);

/*
  Trim that air away, proportionally to the rendered size, so the box the mark
  occupies is its ink. Consumers can then align and space it like any other
  element instead of eyeballing offsets per placement.
*/
const trim = computed(() => ({
  marginLeft: `${-((cut.value.left / 120) * props.size).toFixed(2)}px`,
  marginRight: `${-((cut.value.right / 120) * props.size).toFixed(2)}px`,
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

/*
  Every cut names its mask "m". Two marks on one page - header and footer -
  would collide, and both would resolve to whichever landed in the DOM first,
  so each instance gets its own id.
*/
const uid = useId();

const svg = computed(() =>
  cut.value.src
    .replace('id="m"', `id="${uid}"`)
    .replace("url(#m)", `url(#${uid})`),
);
</script>

<template>
  <span
    class="kosmo-mark"
    :style="trim"
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
  /* the orbit and core ride on currentColor; the satellite has its own var */
  color: var(--kx-text);
}

.kosmo-mark :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  /* the trim above pulls the box inside the artwork - do not clip it */
  overflow: visible;
}
</style>
