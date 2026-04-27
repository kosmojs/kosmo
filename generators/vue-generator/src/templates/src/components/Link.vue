<script setup lang="ts" generic="T extends LinkProps">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { pageRouteMap, type LinkProps } from "{{ createImport 'libCore' }}";

interface Props {
  to: T
  query?: Record<string | number, unknown>
  replace?: boolean
  activeClass?: string
  exactActiveClass?: string
}

const props = defineProps<Props>();

const href = computed(() => {
  const [key, ...params] = props.to
  return pageRouteMap[key]?.base(params as never, props.query)
})
</script>

<template>
  <RouterLink
    :to="href"
    :replace="replace"
    :active-class="activeClass"
    :exact-active-class="exactActiveClass"
  >
    <slot />
  </RouterLink>
</template>
