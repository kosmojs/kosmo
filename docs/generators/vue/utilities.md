---
title: Vue Generator - Utilities
description: Framework utilities that help unwrap Vue refs and handle reactive values
    inside typed fetch client APIs in KosmoJS.
head:
  - - meta
    - name: keywords
      content: vue unwrap, ref unwrap, vue3 reactive utilities,
        kosmojs vue fetch, typed data handling, MaybeWrapped type
---

Generated fetch clients are framework-agnostic - they accept plain objects as
request bodies. But many UI frameworks wrap data in reactive structures,
including Vue's `Ref` type.

Rather than forcing developers to unwrap values manually before each request,
`KosmoJS` includes a unified `unwrap` helper that each framework generator
overrides with its own implementation.

The `Vue` generator provides an implementation that seamlessly works with `Ref` values:

```ts [lib/src/front/unwrap.ts]
import { type Ref, unref } from "vue";

export type MaybeWrapped<T> = Ref<T> | T;

export function unwrap<T>(value: MaybeWrapped<T>): T {
  return unref(value);
}
```

Anywhere the fetch client receives input, it will **automatically** call
`unwrap()` on the underlying data. This makes it safe to pass reactive values
directly into network requests:

```vue [pages/users/index.vue]
<script setup lang="ts">
import { ref } from "vue";
import useFetch from "_/front/fetch/users";

const formData = ref({
  name: "",
  email: "",
});

async function submit() {
  // unwrap is automatically applied inside the fetch client
  await useFetch.POST([], formData.value);
}
</script>

<template>
  <form @submit.prevent="submit">
    ...
  </form>
</template>
```

This allows:

- form state or computed values to flow directly into fetch requests
- consume reactive data anywhere APIs run
- stronger type-safety with no helper boilerplate

Different framework generators provide their own `unwrap` behavior.
For Vue, the rule is simple:

> If it's a `Ref`, unwrap it.
> If it's already a value, return it unchanged.

Small utility - big boost in API developer experience.
