---
title: Tutorial
description: Build a full KosmoJS application step by step - routing, validation,
    middleware, fetch clients, pages, SSR, and multi-folder architecture.
head:
  - - meta
    - name: keywords
      content: vite tutorial, typescript api tutorial, kosmojs walkthrough,
        hono, h3, koa, solidjs, react, vue, svelte, mdx
---

A step-by-step walkthrough covering everything `KosmoJS` provides.

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

A short interactive setup creates the project together with your first source folder,
prompting for the framework and backend.

The folder itself defaults to `app` at base `/` (override later, or via flags in CLI mode).

It is also possible to bootstrap in the current folder, just use `.` as name:

```sh
npm create kosmo .
```

<details class="details custom-block">
<summary>Prefer a scripted setup?</summary>

Provide the framework/backend up front and no prompts appear:

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo demo -- --framework solid --backend hono
```

== pnpm
```sh
pnpm create kosmo demo --framework solid --backend hono
```

== yarn
```sh
yarn create kosmo demo --framework solid --backend hono
```
:::

Want a custom name/base for the source folder? Provide `--name`/`--base`:

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo demo -- --name <name> --base <base> --framework ...
```

== pnpm
```sh
pnpm create kosmo demo --name <name> --base <base> --framework ...
```

== yarn
```sh
yarn create kosmo demo --name <name> --base <base> --framework ...
```
:::

Need no backend? Provide `--no-backend` flag:

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo demo -- --framework solid --no-backend
```

== pnpm
```sh
pnpm create kosmo demo --framework solid --no-backend
```

== yarn
```sh
yarn create kosmo demo --framework solid --no-backend
```
:::

Same for framework, provide the `--no-framework` flag to get a backend-only setup.
</details>

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

## Create Your First API Route

Create `api/users/[id]/index.ts` - `KosmoJS` detects the file and generates boilerplate:

:::tabs key:backend variant:code
== Hono
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    return ctx.text("Automatically generated route: [ users/[id] ]");
  }),
]);
```

== H3
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (event) => {
    return "Automatically generated route: [ users/[id] ]"
  }),
]);
```

== Koa
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/[id] ]"
  }),
]);
```
:::

> Some editors show generated content immediately; others need a brief unfocus/refocus.

Replace with real logic:

:::tabs key:backend variant:code
== Hono
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();
    const user = { id, name: "Jane Smith", email: "jane@example.com" };
    return ctx.json(user);
  }),
]);
```

== H3
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (event) => {
    const { id } = event.context.params;
    const user = { id, name: "Jane Smith", email: "jane@example.com" };
    return user;
  }),
]);
```

== Koa
```ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    const user = { id, name: "Jane Smith", email: "jane@example.com" };
    ctx.body = user;
  }),
]);
```
:::

With dev server running, visit `http://localhost:4556/api/users/123`:

[Details&nbsp;›](/backend/intro)

## Add Validation

### Parameter Validation

Pass a tuple as the second type argument to refine params.
Each position maps to a route parameter in order.
Validation works identically across all frameworks, read validated params via `*.validated.params`:

```ts
type User = { id: number; name: string; email: string }

export default defineRoute<"users/[id]", [
  number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // id is a validated number [!code hl]
    // ...
  }),
]);
```

Use `VRefine` for additional constraints (no import needed):

```ts
defineRoute<"users/[id]", [
  VRefine<number, { minimum: 1, multipleOf: 1 }> // positive integer
]>
```

Raw params still can be accessed via `ctx.req.param()`/`event.context.params`/`ctx.params`,
but they are untyped strings - prefer `ctx.validated.params`.

### Payload/Response Validation

The first type argument to each method handler defines validation targets.

Metadata targets (any method): `query` · `headers` · `cookies`

Body targets (mutually exclusive, POST/PUT/PATCH only): `json` · `form` · `raw`

:::tabs key:backend variant:code
== Hono
```ts
import type { CreateUserPayload, User } from "./types";

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: CreateUserPayload, // [!code hl]
    response: [200, "json", User] // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;
    return ctx.json({ id: 1, name, email, age });
  }),
]);
```

== H3
```ts
import type { CreateUserPayload, User } from "./types";

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: CreateUserPayload, // [!code hl]
    response: [200, "json", User] // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;
    return { id: 1, name, email, age };
  }),
]);
```

== Koa
```ts
import type { CreateUserPayload, User } from "./types";

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
:::

```ts [./types.ts]
export type CreateUserPayload = {
  name: string;
  email: VRefine<string, { format: "email" }>;
  age?: number;
}

export type User = { id: number; name: string; email: string }
```

Payload is validated before your handler runs. Response is validated before it's sent.

[Details&nbsp;›](/validation/intro)

## Add Middleware

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

[Details&nbsp;›](/backend/middleware)

## Fetch Clients

Fetch clients are fully typed and validated client-side using the same high-performance
TypeBox validators as the server - identical results, no duplication, no drift.

Invalid requests are caught before they leave the browser:

:::tabs key:frontend variant:code
== React
```tsx
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

== Solid
```tsx
import { useParams, createAsync } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => GET([params.id]));
  // ...
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
// ...
</script>
```

== MDX
```mdx
import fetchClients from "_/fetch";
import { useLoaderData } from "_/use";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);

export const User = () => {
  const user = useLoaderData();
  // ...
};

<User />
```
:::

Server-side validation still runs even when endpoints are called directly - client validation is additive, not a substitute.

[Details&nbsp;›](/fetch/intro)

## Create Client Pages

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

[Details&nbsp;›](/frontend/routing)

## Server-Side Rendering

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

[Details&nbsp;›](/frontend/server-side-render)

## Add More Source Folders

Your project starts with the source folder created at bootstrap.
As the app grows, add more - one per distinct concern (main app, admin panel, marketing site, etc.).

Each is independent with its own set of frameworks, config, base URL, etc.

:::tabs key:pm variant:code
== npm
```sh
npm run folder
```

== pnpm
```sh
pnpm folder
```

== yarn
```sh
yarn folder
```
:::

You'll be prompted for folder name, base URL, framework, backend, and more.

Non-interactive mode is also supported; just provide arguments and no prompts appear:

- `--name` - folder name (required)
- `--base` - base URL (required)
- `--framework solid|react|vue|svelte|mdx` or `--no-framework` (one required)
- `--backend hono|h3|koa` or `--no-backend` (one required)
- `--ssr` to enable server-side rendering
- `--tsq` to enable TanStack Query

:::tabs key:pm variant:code
== npm
```sh
npm run folder -- --name front --base / --framework solid --backend hono
```

== pnpm
```sh
pnpm folder --name front --base / --framework solid --backend hono
```

== yarn
```sh
yarn folder --name front --base / --framework solid --backend hono
```
:::

Need no backend? Provide the `--no-backend` flag for a frontend-only folder (a static docs or marketing site).

Need no client? Provide the `--no-framework` flag for a backend-only folder (an API service with no UI).

The choice is always explicit - a forgotten flag is an error, never a silent default:

:::tabs key:pm variant:code
== npm
```sh
npm run folder -- --name api --base / --backend hono --no-framework    # API only, no UI
npm run folder -- --name docs --base /docs --framework mdx --no-backend  # UI only, no backend
```

== pnpm
```sh
pnpm folder --name api --base / --backend hono --no-framework    # API only, no UI
pnpm folder --name docs --base /docs --framework mdx --no-backend  # UI only, no backend
```

== yarn
```sh
yarn folder --name api --base / --backend hono --no-framework    # API only, no UI
yarn folder --name docs --base /docs --framework mdx --no-backend  # UI only, no backend
```
:::

Creating a source folder adds framework-specific dependencies. Install them:

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

## Directory-Based Routing

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

[Details&nbsp;›](/routing/intro)

## Path Mappings

Your project starts with a minimal `tsconfig.json`:

```json [tsconfig.json]
{ "extends": "./lib/tsconfig.json" }
```

The extended config provides path mappings used throughout the framework.
You can add your own paths, but these prefixes are reserved:

- `@/*` - Root-level imports
- `~/*` - Source folder imports
- `_/*` - Generated code imports

[Project Structure ›](/essentials/project-structure#path-mappings) walks the whole layout - what
lives in `src/` versus `lib/`, and what each alias resolves to.



---

### Next Steps

**Core patterns:** [Routing](/routing/intro) · [Validation](/validation/intro) · [Middleware](/backend/middleware) · [Layouts](/frontend/routing) · [Fetch Clients](/fetch/start)

**Advanced:** [VRefine](/validation/refine) · [OpenAPI](/openapi) · [Production Builds](/backend/building-for-production)
