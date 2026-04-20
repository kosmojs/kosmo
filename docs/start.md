---
title: Quick Start
description: Get a KosmoJS project running in under five minutes.
head:
  - - meta
    - name: keywords
      content: vite setup, kosmojs quickstart, create kosmo, typescript api
---

Zero to a working route in under five minutes.

## 🚀 Create & install

::: code-group
```sh [pnpm]
pnpm create kosmo
cd my-app
pnpm install
```

```sh [npm]
npm create kosmo
cd my-app
npm install
```

```sh [yarn]
yarn create kosmo
cd my-app
yarn install
```
:::

## 📁 Add a source folder

::: code-group
```sh [pnpm]
pnpm +folder
pnpm install
```

```sh [npm]
npm run +folder
npm install
```

```sh [yarn]
yarn +folder
yarn install
```
:::

You'll be prompted for a folder name, base URL, framework, and backend.
The second install pulls in framework-specific dependencies.

## ✅ Create a route

Create the file `api/users/[id]/index.ts` - `KosmoJS` detects it
and generates starter code automatically.

Replace the generated content with something real:

::: code-group
```ts [Koa]
import { defineRoute } from "_/api";

type User = { id: number; name: string; email: string }

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    ctx.body = { id: Number(id), name: "Jane Smith", email: "jane@example.com" };
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/api";

type User = { id: number; name: string; email: string }

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();
    ctx.json({ id: Number(id), name: "Jane Smith", email: "jane@example.com" });
  }),
]);
```
:::

## ⚡ Start the dev server

::: code-group
```sh [pnpm]
pnpm dev
```

```sh [npm]
npm run dev
```

```sh [yarn]
yarn dev
```
:::

Visit `http://localhost:4556/api/users/123`. You should see JSON.

## 🎨 Create a page

With the dev server still running, create `pages/users/[id]/index.tsx` (or `.vue`).
`KosmoJS` generates a placeholder component - replace it with a page that fetches from your API route:

::: code-group
```tsx [React]
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function UserPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => { GET([id]).then(setUser); }, [id]);

  return user
    ? <div><h1>{user.name}</h1><p>{user.email}</p></div>
    : <div>Loading...</div>;
}
```

```tsx [SolidJS]
import { useParams } from "@solidjs/router";
import { createAsync } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => GET([params.id]));

  return user()
    ? <div><h1>{user().name}</h1><p>{user().email}</p></div>
    : <div>Loading...</div>;
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];
const route = useRoute();
const user = ref(null);

onMounted(async () => { user.value = await GET([route.params.id]); });
</script>

<template>
  <div v-if="user"><h1>{{ user.name }}</h1><p>{{ user.email }}</p></div>
  <div v-else>Loading...</div>
</template>
```
:::

Visit `http://localhost:4556/users/123`. Your page renders with data from the API.

The fetch client is fully typed - `user.name` and `user.email` autocomplete in your editor,
and invalid parameters are caught before the request leaves the browser.

## ✨ What just happened

Your folder structure became your routes:

```
api/users/[id]/index.ts     ➜  /api/users/:id
pages/users/[id]/index.tsx  ➜  /users/:id
```

`[id]` is a required parameter. `{id}` makes it optional. `{...path}` matches any depth.
The parallel structure between `api/` and `pages/` is intentional -
API endpoints and their corresponding pages are always easy to find.

The fetch client was generated automatically from your API route definition.
Change the API types, and the client updates with them - no manual sync.

---

That's the foundation. From here:

- [Tutorial](/tutorial) - validation, middleware, fetch clients, pages, SSR
- [Routing](/routing/intro) - parameters, mixed segments, power syntax
- [Features](/features) - everything KosmoJS provides, at a glance
