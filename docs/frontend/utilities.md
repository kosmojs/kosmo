---
title: Framework Utilities
description: Framework-specific utilities for unwrapping reactive data structures
  in fetch client requests. SolidJS store unwrapping, Vue Ref unwrapping, and
  the MaybeWrapped type for transparent reactive data handling.
head:
  - - meta
    - name: keywords
      content: solidjs store unwrap, vue ref unwrap, MaybeWrapped type, reactive data,
        fetch client integration, kosmojs utilities, unwrap utility, reactive stores
---

Generated fetch clients are framework-agnostic - they accept plain objects as
request payloads. But reactive frameworks wrap state in their own structures:
SolidJS uses stores, Vue uses `Ref`. Passing these directly into a fetch client
without unwrapping would produce incorrect request bodies.

Rather than requiring manual unwrapping before every request, `KosmoJS`
provides an `unwrap` placeholder that each framework generator overrides with
its own implementation. Fetch clients call `unwrap` internally, so reactive
data flows through transparently without any extra steps.

## 🔌 Implementation

::: code-group

```ts [SolidJS · lib/unwrap.ts]
export type MaybeWrapped<T> = import("solid-js/store").Store<T> | T;
export { unwrap } from "solid-js/store";
```

```ts [Vue · lib/unwrap.ts]
import { type Ref, unref } from "vue";

export type MaybeWrapped<T> = Ref<T> | T;

export function unwrap<T>(value: MaybeWrapped<T>): T {
  return unref(value);
}
```

```ts [React · lib/unwrap.ts]
// React state is always plain values - no unwrapping needed.
// The default no-op implementation is used as-is.
export type MaybeWrapped<T> = T;
export const unwrap = <T>(value: T): T => value;
```

:::

`MaybeWrapped<T>` signals that a value may be either a reactive wrapper or a
plain value. `unwrap` extracts the plain value in either case - the caller
never needs to know which it received.

## 📦 Usage

Pass reactive data directly into fetch client calls - `unwrap` is applied
internally:

::: code-group

```tsx [SolidJS]
import { createStore } from "solid-js/store";
import fetchClients from "_/front/fetch";

export default function Page() {
  const [formData, setFormData] = createStore({ name: "", email: "" });

  const handleSubmit = async () => {
    // store is unwrapped automatically inside the fetch client
    await fetchClients["users"].POST([], { form: formData });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

```vue [Vue]
<script setup lang="ts">
import { ref } from "vue";
import fetchClients from "_/front/fetch";

const json = ref({ name: "", email: "" });

async function submit() {
  // Ref is unwrapped automatically inside the fetch client
  await fetchClients["users"].POST([], { json });
}
</script>

<template>
  <form @submit.prevent="submit">...</form>
</template>
```

:::

## 🔧 Custom Unwrap Logic

For cases requiring custom unwrapping, pass an `unwrap` option directly to the
fetch call - it overrides the generator-provided implementation for that
request:

```ts
await fetchClients["users"].POST([], { json: data }, {
  unwrap: (value) => { /* custom logic */ },
});
```

This is an escape hatch for non-standard data structures or special
serialization needs.
