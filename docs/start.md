---
title: Getting Started
description: Get started with KosmoJS in minutes. Create a new Vite project with multiple source folders,
    set up directory-based routing, and configure your frontend framework of choice.
head:
  - - meta
    - name: keywords
      content: vite setup, typescript project setup, create vite app, multi-folder vite,
        hono api, koa api, solidjs setup, react setup, vue setup, vite dev server
---

Starting your `KosmoJS` journey is a breeze! ✨

## 🚀 Create Your Project

::: code-group
```sh [npm]
npm create kosmo
# non-interactive: npm create kosmo --name my-app
```

```sh [pnpm]
pnpm create kosmo
# non-interactive: pnpm create kosmo --name my-app
```

```sh [yarn]
yarn create kosmo
# non-interactive: yarn create kosmo --name my-app
```
:::

```sh
cd ./my-app
```

## 📦 Install Dependencies

::: code-group
```sh [npm]
npm install
```

```sh [pnpm]
pnpm install
```

```sh [yarn]
yarn install
```
:::

## 📁 Create a Source Folder

`KosmoJS` doesn't create a source folder automatically - you add them as needed,
one per distinct concern (main app, admin panel, marketing site, etc.).
Each is independent with its own set of frameworks, config, base URL, etc.

::: code-group
```sh [npm]
npm run +folder
```

```sh [pnpm]
pnpm +folder
```

```sh [yarn]
yarn +folder
```
:::

You'll be prompted for folder name, base URL, framework, backend, and SSR.

Also non-interactive mode supported with following options:

- `--name`
- `--base`
- `--framework solid|react|vue`
- `--backend koa|hono`
- `--ssr`

::: code-group
```sh [npm]
npm run +folder -- --name front --base / --framework solid --backend koa --ssr
```

```sh [pnpm]
pnpm +folder --name front --base / --framework solid --backend koa --ssr
```

```sh [yarn]
yarn +folder --name front --base / --framework solid --backend koa --ssr
```
:::


The source folder may add new dependencies - run install again:

::: code-group
```sh [npm]
npm install
```

```sh [pnpm]
pnpm install
```

```sh [yarn]
yarn install
```
:::

## 🛣️ Directory-Based Routing

Folder names become URL segments. Each route requires an `index` file:

```txt
api/
  users/
    index.ts          ➜ /api/users
    [id]/
      index.ts        ➜ /api/users/:id

pages/
  users/
    index.tsx         ➜ /users
    [id]/
      index.tsx       ➜ /users/:id
```

Parameters: `[id]` required · `{id}` optional · `{...path}` splat.
Same pattern for API and pages - learn once, use everywhere.

[Read more ➜](/routing/intro)

## 💡 Path Mappings


Your project starts with a minimal `tsconfig.json`:

```json [tsconfig.json]
{ "extends": "./lib/tsconfig.base.json" }
```

The extended `tsconfig.base.json` contains essential path mappings that enable your application to work properly.

You can add additional paths, but these prefixes are reserved and must not be overridden:

- `@/*` - Root-level imports
- `~/*` - Source folder imports
- `_/*` - Generated code imports


## ⚙️ Create Your First API Route

Create `api/users/[id]/index.ts` - `KosmoJS` detects the file and generates boilerplate:

::: code-group
```ts [Koa]
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/[id] ]"
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    ctx.text("Automatically generated route: [ users/[id] ]");
  }),
]);
```
:::

> Some editors show generated content immediately; others need a brief unfocus/refocus.

Replace with real logic:

::: code-group
```ts [Koa]
import { defineRoute } from "_/api";

type User = { id: number; name: string; email: string }

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    const user: User = { id: Number(id), name: "Jane Smith", email: "jane@example.com" };
    ctx.body = user;
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/api";

type User = { id: number; name: string; email: string }

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();
    const user: User = { id: Number(id), name: "Jane Smith", email: "jane@example.com" };
    ctx.json(user);
  }),
]);
```
:::

Start the dev server and visit `http://localhost:4556/api/users/123`:

::: code-group
```sh [npm]
npm run dev
```

```sh [pnpm]
pnpm dev
```

```sh [yarn]
yarn dev
```
:::

[Read more ➜](/api-server/intro)

## 🛡️ Add Validation

### Parameter Validation

Pass a tuple as the second type argument to refine params. Each position maps to a route parameter in order:

::: code-group
```ts [Koa]
export default defineRoute<"users/[id]", [
  number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // number, not string [!code hl]
    const user: User = { id, name: "Jane Smith", email: "jane@example.com" };
    ctx.body = user;
  }),
]);
```

```ts [Hono]
export default defineRoute<"users/[id]", [
  number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // number, not string [!code hl]
    const user: User = { id, name: "Jane Smith", email: "jane@example.com" };
    ctx.json(user);
  }),
]);
```
:::

Use `VRefine` for additional constraints (no import needed):

```ts
defineRoute<"users/[id]", [
  VRefine<number, { minimum: 1, multipleOf: 1 }> // positive integer
]>
```

`ctx.params`/`ctx.req.param()` still exist but return untyped strings - prefer `ctx.validated.params`.

### Payload/Response Validation

The first type argument to each method handler defines validation targets.

Metadata targets (any method): `query` · `headers` · `cookies`

Body targets (mutually exclusive, POST/PUT/PATCH/DELETE only): `json` · `form` · `raw`

::: code-group
```ts [Koa]
type CreateUserPayload = {
  name: string;
  email: VRefine<string, { format: "email" }>;
  age?: number;
}

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: CreateUserPayload, // [!code hl]
    response: [200, "json", User] // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;
    ctx.body = { id: 1, name, email, age };
  }),
]);
```

```ts [Hono]
type CreateUserPayload = {
  name: string;
  email: VRefine<string, { format: "email" }>;
  age?: number;
}

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: CreateUserPayload, // [!code hl]
    response: [200, "json", User] // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;
    ctx.json({ id: 1, name, email, age });
  }),
]);
```
:::

Payload is validated before your handler runs. Response is validated before it's sent.

[Read more ➜](/validation/intro)

## ▶️ Add Middleware

For simple cases, wire middleware inline with `use`:

```ts
import { logRequest } from "~/middleware/logging";

export default defineRoute<"users/[id]">(({ use, GET }) => [
  use(logRequest),
  GET(async (ctx) => { /* ... */ }),
]);
```

For anything shared across routes, use cascading middleware instead.
Create `api/users/use.ts` - it wraps every route under `/api/users` automatically:

```ts [api/users/use.ts]
import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    // runs for every route under /api/users
    return next();
  })
];
```

No imports in route files, no repetition. Parent `use.ts` files wrap child routes automatically.

[Read more ➜](/api-server/middleware)

## 📥 Fetch Clients

Fetch clients are fully typed and validated client-side using the same high-performance
TypeBox validators as the server - identical results, no duplication, no drift.

Invalid requests are caught before they leave the browser:

::: code-group
```tsx [SolidJS]
import { useParams, createAsync } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => GET([params.id]));
  // ...
}
```

```tsx [React]
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function UserPage() {
  const params = useParams();
  const [user, setUser] = useState(null);
  useEffect(() => { GET([params.id]).then(setUser); }, [params.id]);
  // ...
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
```
:::

Server-side validation still runs even when endpoints are called directly - client validation is additive, not a substitute.

[Read more ➜](/fetch/intro)

## 🎨 Create Client Pages

Pages live in `pages/` and follow the same directory-based routing as API routes.
Create `pages/users/index.tsx` - `KosmoJS` generates framework-specific boilerplate.

Add a layout for shared UI across route groups - create `pages/users/layout.tsx`:

```txt
pages/
└── users/
    ├── layout.tsx    ← wraps all pages under /users
    └── index.tsx
```

Layouts can be nested - deeper layouts wrap inner layouts, matching your route hierarchy.

[Read more ➜](/frontend/routing)

## ⚡ Server-Side Rendering

Enable when creating a source folder (`--ssr`), or add it later in `kosmo.config.ts`:

```ts [kosmo.config.ts]
import { defineConfig, ssrGenerator } from "@kosmojs/dev"; // [!code ++]

export default defineConfig({
  generators: [
    // ...
    ssrGenerator(), // [!code ++]
  ]
});
```

> Restart dev server after adding new generators.

`KosmoJS` generates `entry/server.ts` - your SSR orchestration file.
Critical CSS is extracted and inlined automatically; remaining styles load asynchronously.

Build and run:

```sh
pnpm build
node dist/front/ssr/server.js -p 4556
```

The API server and SSR server are bundled separately - deploy, scale, and run them independently.

[Read more ➜](/frontend/server-side-render)

## 🗂️ Multiple Source Folders

Add more source folders as your app grows - each serving a specific purpose.

```sh
pnpm dev  # runs all source folders in parallel
```

---

### Next Steps

**Core patterns:** [Routing](/routing/intro) · [Validation](/validation/intro) · [Middleware](/api-server/middleware) · [Layouts](/frontend/routing) · [Fetch Clients](/fetch/start)

**Advanced:** [VRefine](/validation/refine) · [OpenAPI](/openapi) · [Production Builds](/api-server/building-for-production)
