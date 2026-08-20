---
title: Features
description: Explore KosmoJS features including multiple source folders,
    directory-based routing, end-to-end type safety, generated fetch clients,
    OpenAPI specs, and framework freedom - Hono, H3, Koa, React, Solid, Svelte, Vue, MDX.
head:
  - - meta
    - name: keywords
      content: typescript validation, vite multi-app, type-safe routing,
        fetch client generator, isomorphic fetch, ssr, streaming ssr, openapi 3.1,
        tanstack query, react query, solidjs, react, vue, mdx, hono, h3, koa
---

Everything `KosmoJS` provides, at a glance.

## Multiple Source Folders

Organize distinct concerns - public site, customer app, admin dashboard -
as independent source folders within a single `Vite` project.
Each gets its own set of frameworks, base URL, development workflow and build pipeline.

[Read more ›](/tutorial#create-your-first-api-route)

## Directory-Based Routing

Your folder structure defines your routes - for both API and client pages.

```
api/users/[id]/index.ts    ➜ /api/users/:id
pages/users/[id]/index.tsx ➜ /users/:id
```

Dynamic parameters: `[id]` required · `{id}` optional · `{...path}` splat.
No separate routing config to maintain - restructure files and routes update automatically.

Mixed segments are also supported for backend routes (and some frontend integrations):

```
products/[category].html/index.ts   ➜ products/electronics.html
files/[name].[ext]/index.ts         ➜ files/document.pdf, /files/logo.png
```

[Read more ›](/routing/intro)

## End-to-End Type Safety

Write `TypeScript` types once - `KosmoJS` generates runtime validators automatically.
The same definition drives compile-time checking, runtime validation, type-safe fetch clients, and OpenAPI specs.

```ts
export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: VRefine<string, { format: "email" }>;
      age: VRefine<number, { minimum: 18 }>;
    },
    response: [200, "json", User],
  }>(async (ctx) => {
    const { email, age } = ctx.validated.json;
    // payload validated before reaching here
    // response validated before sending
  }),
]);
```

[Read more ›](/validation/intro)

## Typed Fetch Clients + OpenAPI

For every API route, `KosmoJS` generates a fully-typed fetch client
and an OpenAPI 3.1 spec - both derived from the same type definitions.

```ts
import fetchClients from "_/fetch";

const user = await fetchClients["users/[id]"].GET([123]);
// fully typed, validates payload client-side before the request is sent
```

[Fetch Clients ›](/fetch/intro) · [OpenAPI ➜](/openapi)

## Isomorphic Fetch

The same fetch client runs on the server and the client.

When a call fires during SSR, the request goes to the API route in-process,
skipping the network while still running the full validation and handler chain.

The result is serialized into the page and reused on hydration,
so the request is not repeated on the client.

```ts
// runs on the server during SSR, on the client during navigation -
// same call, same types, no network hop on the server
export const loader = ({ params }) => fetchClients["users/[id]"].GET([params.id]);
```

[Read more ›](/fetch/integration#isomorphic-fetch)

## Built-in Streaming SSR

Render pages as a stream instead of a single string - the shell flushes to the
browser early, improving Time-to-First-Byte for large pages or long data-fetching chains.

Each framework streams through its own native renderer,
returning a web-standard `ReadableStream` that works the same on Node, Bun, and Deno;
`KosmoJS` adds no rendering layer of its own.

Streaming is opt-in - every route defaults to string rendering.
Set `renderMode: "stream"` to stream all routes, or map glob patterns for per-route selection:

```ts [kosmo.config.ts]
ssrGenerator({
  renderMode: {
    "docs/**": "stream",
  },
})
```

Available for `React`, `SolidJS`, and `Vue`; `MDX` renders to a string.

[Read more ›](/frontend/server-side-render#stream-rendering)

## Composable Middleware (Slots)

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

[Read more ›](/backend/middleware)

## Cascading Middleware

Place a `use.ts` file in any folder and its middleware automatically wraps
all routes in that folder and its subfolders - no imports or wiring needed.

```
api/admin/use.ts       → wraps all routes under /api/admin
api/admin/users/use.ts → wraps only routes under /api/admin/users
```

Parent middleware always runs before child middleware.
Combine with slots to override globals for entire route subtrees.

[Read more ›](/backend/cascading-middleware)

## Nested Layouts

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

[Read more ›](/frontend/routing)

## TanStack Query Integration

Opt into TanStack Query per source folder and `KosmoJS` wires it for you - the
query client is provided, per-request on the server and a singleton in the
browser, with no setup in your app code. Enabling it is one option; using it is
just importing `useQuery`.

```ts [kosmo.config.ts]
reactGenerator({ tanstack: { query: true } })
```

```tsx
// then, in any component - the client is already provided
const { data } = useQuery({ queryKey: ["users", id], queryFn: () => GET([id]) });
```

Works across `React`, `SolidJS`, `Vue`, and `Svelte`, each on its own official
adapter. `KosmoJS` provides the seamless basic path and stays out of the way of
the rest: advanced SSR warmup uses TanStack's own `dehydrate` and
`HydrationBoundary` directly, not a wrapper that could drift from them.

[Read more ›](/frontend/tanstack-query)

## Multiple Frameworks

- **Backend:** `Hono`, `H3`, `Koa` - same routing architecture, middleware, validation and type safety.
- **Frontend:** `React`, `Vue`, `SolidJS`, `Svelte`, `MDX` - same routing/layout/SSR.

Different source folders can use different framework combinations.
When you add a source folder, `KosmoJS` generates a ready-to-go setup for your chosen stack -
router config, entry points, TypeScript settings, and all the wiring between them.
Switch frameworks per folder without learning a new set of conventions.

[Read more ›](/frontend/intro)

## Built on Proven Tools

No proprietary runtime, no custom bundler, no framework lock-in.
Every layer is a tool you can use, debug, and replace independently.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
