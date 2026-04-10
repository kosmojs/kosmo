---
title: Quick Start
description: Get a KosmoJS project running in under five minutes.
head:
  - - meta
    - name: keywords
      content: vite setup, kosmojs quickstart, create kosmo, typescript api
---

Zero to a working API route in under five minutes.

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

## ✨ What just happened

Your folder structure became your route:

```
api/users/[id]/index.ts  ➜  /api/users/:id
```

`[id]` is a required parameter. `{id}` makes it optional. `{...path}` matches any depth.
The same pattern works for client pages in `pages/`.

---

That's the foundation. From here:

- [Tutorial](/tutorial) - validation, middleware, fetch clients, pages, SSR
- [Routing](/routing/intro) - parameters, mixed segments, power syntax
- [Features](/features) - everything KosmoJS provides, at a glance
