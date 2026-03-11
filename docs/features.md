---
title: Features
description: Explore KosmoJS features including multiple source folders,
    directory-based routing, end-to-end type safety, generated fetch clients,
    OpenAPI specs, and framework freedom - Koa, Hono, React, Solid, Vue.
head:
  - - meta
    - name: keywords
      content: typescript validation, vite multi-app, type-safe routing, fetch client generator,
        openapi 3.1, solidjs vite, react vite, vue vite, koa middleware, hono middleware,
        cascading middleware, middleware slots, power syntax routing
---

`KosmoJS` is a `Vite`-based meta-framework for full-stack `TypeScript` apps -
directory-based routing, runtime validation from types, generated fetch clients, and OpenAPI,
with your choice of backend and frontend framework.

## 🗂️ Multiple Source Folders

Organize distinct concerns - public site, customer app, admin dashboard -
as independent source folders within a single `Vite` project.
Each gets its own base URL, dev server, port, and `Vite` config.

[Read more ➜](/start#📁-create-your-first-source-folder)

## 🛣️ Directory-Based Routing

Your folder structure defines your routes - for both API and client pages.

```
api/users/[id]/index.ts    ➜ /api/users/:id
pages/users/[id]/index.tsx ➜ /users/:id
```

Dynamic parameters: `[id]` required · `{id}` optional · `{...path}` splat.
No separate routing config to maintain - restructure files and routes update automatically.

Also mixed sections supported for backend routes (and some frontend integrations):

```
products/[category].html/index.ts   ➜ products/electronics.html
files/[name].[ext]/index.ts         ➜ files/document.pdf, /files/logo.png
```

[Read more ➜](/routing/intro)

## ⚡ Power Syntax for Params

When standard named parameters aren't enough, use raw [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp)
patterns directly in your folder names:

```
book{-:id}-info           ➜ /book-info or /book-123-info
locale{-:lang{-:country}} ➜ /locale, /locale-en, /locale-en-US
api/{v:version}/users     ➜ /api/users or /api/v2/users
```

Any folder name containing non-alphanumeric characters (except `-` and `.`)
is treated as a raw pattern - giving you precise control over URL structure
without sacrificing the directory-based routing model.

[Read more ➜](/routing/params#power-syntax)

## 🛡️ End-to-End Type Safety

Write `TypeScript` types once - `KosmoJS` generates runtime validators automatically.
The same definition drives compile-time checking, runtime validation, and API docs.

```ts
export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: TRefine<string, { format: "email" }>;
      age: TRefine<number, { minimum: 18 }>;
    },
    response: [200, "json", User],
  }>(async (ctx) => {
    const { email, age } = ctx.validated.json;
    // payload validated before reaching here
    // response validated before sending
  }),
]);
```

[Read more ➜](/validation/intro)

## 🔗 Generated Fetch Clients + OpenAPI

For every API route, `KosmoJS` generates a fully-typed fetch client
and an OpenAPI 3.1 spec - both derived from the same type definitions.

```ts
import fetchClients from "_/front/fetch";

const user = await fetchClients["users/[id]"].GET([123]);
// fully typed, validates payload client-side before the request is sent
```

[Fetch Clients ➜](/fetch/intro) · [OpenAPI ➜](/openapi)

## 🎛️ Composable Middleware (Slots)

Global middleware defined in `api/use.ts` can be overridden per-route or per-subtree
using named slots - without removing or bypassing parent middleware entirely.

```ts
// global default in api/use.ts
use(async (ctx, next) => { /* ... */ }, { slot: "logger" })

// override for a specific route
use(async (ctx, next) => { /* custom logger */ }, { slot: "logger" })
```

Slots give you surgical control over middleware composition:
replace only what needs replacing, inherit everything else.
Custom slot names are supported by extending the `UseSlots` interface.

[Read more ➜](/api-server/middleware)

## 🌊 Cascading Middleware

Place a `use.ts` file in any folder and its middleware automatically wraps
all routes in that folder and its subfolders - no imports or wiring needed.

```
api/admin/use.ts       → wraps all routes under /api/admin
api/admin/users/use.ts → wraps only routes under /api/admin/users
```

Parent middleware always runs before child middleware.
Combine with slots to override globals for entire route subtrees.

[Read more ➜](/api-server/cascading-middleware)

## 🪆 Nested Layouts

Frontend pages support nested layout components that wrap child routes -
compose shared UI (nav, sidebars, auth shells) at any level of the route hierarchy.

```
pages/
  app/
    layout.tsx        ← wraps all /app/* pages
    dashboard/
      layout.tsx      ← wraps all /app/dashboard/* pages
      index.tsx
      settings/
        index.tsx
```

[Read more ➜](/frontend/routing)

## 🎨 Multiple Frameworks

**Backend:** `Koa` or `Hono` - same routing architecture, same type safety.
**Frontend:** `React`, `Vue`, or `SolidJS` - same routing conventions.

Different source folders can use different framework combinations.
When you add a source folder, `KosmoJS` generates a ready-to-go setup for your chosen stack.

[Read more ➜](/frontend/intro)

## 🔧 Built on Proven Tools

`Koa`/`Hono` · `Vite` · `TypeScript` · `path-to-regexp` · `TypeBox`.
No proprietary abstractions - just structure on top of tools you already know.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
