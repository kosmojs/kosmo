---
title: Quick Start
description: Get a KosmoJS project running in under five minutes.
head:
  - - meta
    - name: keywords
      content: vite setup, kosmojs quickstart, create kosmo, typescript api
---

Zero to a working route in under five minutes.

<!-- [![asciicast](https://asciinema.org/a/968086.svg)](https://asciinema.org/a/968086) -->

## Create a Project

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo demo
```

== pnpm
```sh
pnpm create kosmo demo
```

== yarn
```sh
yarn create kosmo demo
```
:::

A short interactive setup walks you through the choices that matter:
the frontend framework and the backend you want to build with.
Everything else starts with sensible defaults.

Pick whatever feels familiar - nothing here is set in stone,
and any folder you add later can make entirely different choices.

It is also possible to bootstrap in the current folder, just use `.` as name:

```sh
npm create kosmo .
```

---

After bootstrap, `cd` into freshly created project (unless project bootstraped in current folder):

```sh
cd ./demo
```

#### Install Dependencies

:::tabs key:pm variant:code
== npm
```sh
npm install
```

== pnpm
```sh
pnpm install
```

== yarn
```sh
yarn install
```
:::

What you have at this point is deliberately minimal:
a `package.json` and your source folder's config with a few empty stub files.
Follow next steps to turn this skeleton into a working app.

## Start the dev server

The dev server completes the setup: it generates the remaining project files and wires everything together.
From then on it watches your routes and regenerates as you work:

:::tabs key:pm variant:code
== npm
```sh
npm run dev
```

== pnpm
```sh
pnpm dev
```

== yarn
```sh
yarn dev
```
:::

Your app is now running at `http://localhost:4556`.

## Create a route

Create the file `api/users/[id]/index.ts` - `KosmoJS` detects it
and generates starter code automatically.

Replace the generated content with something real:

:::tabs key:backend variant:code
== Hono
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();
    return ctx.json({ id, name: "Jane Smith", email: "jane@example.com" });
  }),
]);
```

== H3
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (event) => {
    const { id } = event.context.params;
    return { id, name: "Jane Smith", email: "jane@example.com" };
  }),
]);
```

== Koa
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    ctx.body = { id, name: "Jane Smith", email: "jane@example.com" };
  }),
]);
```
:::

Visit `http://localhost:4556/api/users/123`. You should see JSON.

## Create a page

With the dev server still running, create `pages/users/[id]/index.tsx`
(or `.vue` / `.svelte` / `.mdx`).
`KosmoJS` generates a placeholder component - replace it with a page that fetches from your API route.
React, SolidJS, and Vue fetch in the component here; Svelte and MDX read through a
`loader` export instead (resolved before render), so they need no loading state:

:::tabs key:frontend variant:code
== React
```tsx
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

== Solid
```tsx
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

== Vue
```vue
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

== Svelte
```svelte
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

<div><h1>{user.name}</h1><p>{user.email}</p></div>
```

== MDX
```mdx
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);

export const UserPage = () => {
  const user = useLoaderData();
  return <div><h1>{user.name}</h1><p>{user.email}</p></div>;
};

<UserPage />
```
:::

Visit `http://localhost:4556/users/123`. Your page renders with data from the API.

The fetch client is fully typed - `user.name` and `user.email` autocomplete in your editor,
and invalid parameters are caught before the request leaves the browser.

## What just happened

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
- [Project Structure](/essentials/project-structure) - what lives where, and what `@/` `~/` `_/` mean
- [Configuration](/essentials/config) - every `kosmo.config.ts` option and generator
- [Routing](/routing/intro) - parameters, mixed segments, power syntax
- [Framework Support](/essentials/frameworks) - what each framework does and doesn't support
- [Features](/features) - everything KosmoJS provides, at a glance
