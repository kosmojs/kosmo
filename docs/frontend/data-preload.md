---
title: Data Preloading
description: Prefetch route data before components render using React Router's
  loader pattern, SolidJS Router's preload pattern, and Vue Router's navigation
  guards. Type-safe data availability derived from API endpoint definitions.
head:
  - - meta
    - name: keywords
      content: react router loaders, useLoaderData, solidjs preload, createAsync,
        vue navigation guards, data prefetching, route data loading, async loading,
        type-safe data, kosmojs data fetching
---

Preloading ensures data is ready before a component renders, eliminating
loading spinners for route-level data and creating seamless navigation
experiences. Each framework has its own mechanism - all integrate naturally
with `KosmoJS`'s generated fetch clients.

## 📡 API Endpoint

Start by creating an API endpoint that provides the data. The same endpoint
is used across all three frameworks:

```ts [api/users/data/index.ts]
import { defineRoute } from "_/front/api";

export default defineRoute<"users/data">(({ GET }) => [
  GET<{ response: [200, "json", Data] }>(async (ctx) => {
    ctx.body = await fetchUserData();
  }),
]);
```

## 🔌 Page Integration

::: code-group

```tsx [React]
import { useLoaderData } from "react-router";
import fetchClients, { type ResponseT } from "_/front/fetch";

const { GET } = fetchClients["users/data"];

// Export the fetch function as loader -
// React Router calls it before the component renders
export { GET as loader };

export default function Page() {
  // useLoaderData retrieves the already-fetched result - no duplicate request
  const data = useLoaderData<ResponseT["users/data"]["GET"]>();

  return (
    <div>
      {data && <UserList users={data.users} />}
    </div>
  );
}
```

```tsx [SolidJS]
import { createAsync } from "@solidjs/router";
import fetchClients from "_/front/fetch";

const { GET } = fetchClients["users/data"];

// Export the fetch function as preload -
// SolidJS Router calls it on link hover and navigation intent
export { GET as preload };

export default function Page() {
  // createAsync recognizes GET as the preloaded function
  // and reuses the cached result - no duplicate request
  const data = createAsync(GET);

  return (
    <div>
      {data() && <UserList users={data().users} />}
    </div>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import fetchClients, { type ResponseT } from "_/front/fetch";

const { GET } = fetchClients["users/data"];

const data = ref<ResponseT["users/data"]["GET"] | null>(null);

// Vue Router has no built-in preload hook -
// fetch on mount or use a navigation guard in router.ts
onMounted(async () => {
  data.value = await GET();
});
</script>

<template>
  <div>
    <UserList v-if="data" :users="data.users" />
  </div>
</template>
```

:::

## 🔍 How It Works

**React** - the `loader` export tells React Router what function to call
before rendering. `useLoaderData` retrieves the result that was already
fetched - no duplicate request. Type safety flows end-to-end: the fetch
client's `GET` is typed from your API definition, and `useLoaderData` is
parameterized with the matching response type.

**SolidJS** - the `preload` export tells SolidJS Router to call the function
on link hover and navigation intent. `createAsync` receives the same function
reference and recognizes it as already-cached data, reusing it without
re-fetching. Type inference is automatic - `createAsync` infers its return
type directly from the function signature.

**Vue** - Vue Router has no built-in route-level preload mechanism. The
idiomatic approach is `onMounted` for initial data, `watch` on route params
for reactive updates, or navigation guards in `router.ts` for blocking
pre-fetch before the component mounts. See the
[Vue Router documentation](https://router.vuejs.org/guide/advanced/data-fetching.html)
for the full range of options.
