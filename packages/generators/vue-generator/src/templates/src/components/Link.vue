<script setup lang="ts" generic="T extends LinkProps">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { stringify } from "@kosmojs/core/fetch";

import { unwrap } from "{{ createImport 'lib' 'unwrap' }}";
import { type LinkProps, routeMap } from "{{ createImport 'lib' 'router' }}";
import { baseurl } from "{{ createImport 'config' }}";

interface Props {
  to?: T
  query?: Record<string | number, unknown>
  replace?: boolean
  activeClass?: string
  exactActiveClass?: string
}

const props = defineProps<Props>()

const route = useRoute()

const href = computed(() => {
  if (props.to) {
    const [key, ...params] = props.to
    return routeMap[key]?.base(params as never, props.query)
  }
  const path = route.path.replace(
    new RegExp(`^${baseurl.replace(/\/+$/, "")}/`),
    "/",
  )
  return props.query ? [path, stringify(unwrap(props.query))].join("?") : path
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
