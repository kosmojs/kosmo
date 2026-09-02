---
title: Coming from Next.js, TanStack, tRPC, etc.
description: Translation guide for developers moving to KosmoJS from Next.js App Router,
    TanStack Start/Router or tRPC - server actions, route groups, parallel routes, loading.tsx,
    revalidateTag, next/image, validateSearch, routeTree.gen.ts and middleware.ts, each mapped
    to its KosmoJS equivalent or explicitly marked as having none.
head:
  - - meta
    - name: keywords
      content: next.js migration, tanstack start, tanstack router, trpc, server actions, use server,
        route groups, parallel routes, intercepting routes, loading.tsx, error.tsx, not-found.tsx,
        revalidatePath, revalidateTag, ISR, next/image, next/font, validateSearch, routeTree.gen.ts,
        middleware.ts, createServerFn, RSC, react server components, app router equivalent
---

If you are arriving from **Next.js App Router**, **TanStack Start/Router** or **tRPC**,
most of what you know transfers - and a few things deliberately don't.

The one shift worth internalizing first: **the client/server boundary is an HTTP call.**

Server code lives in `api/`, client code in `pages/`, and a typed fetch client carries the types across.
There is no interleaving of server and client code in one file.
During SSR that call runs [**in-process**](/fetch/intro#isomorphic-fetch), so the boundary costs nothing on the server.

The second shift: **the unit of an app is a [source folder](/essentials/project-structure).**

Not a route group or a workspace package. A folder has its own framework, base URL, middleware
and build - so several organizational features other frameworks provide inside one app are
structural here instead.

## Quick reference

| You're looking for | In KosmoJS |
|---|---|
| `app/page.tsx` | a folder with an [index file](/routing/rationale) - `pages/users/[id]/index.tsx` |
| `[id]` / TanStack `$id` | `[id]` - same concept, [required param](/routing/params) |
| `[...slug]` / `[[...slug]]` | `{...path}` - one splat [covers both](/routing/params) |
| optional segment | `{id}` - same concept, [optional param](/routing/params) |
| `layout.tsx` / `_layout` | `layout.*` in a [route folder](/frontend/layouts) |
| `not-found.tsx` | `pages/404.*` - a [dedicated](/frontend/error-pages) page for 404 errors |
| `loading.tsx` / `error.tsx` | your framework's Suspense / error boundary, at [app.*](/frontend/application) |
| `(group)` route groups | a separate [source folder](/essentials/project-structure#inside-a-source-folder) |
| `@slot` parallel / `(.)` intercepting | no equivalent - compose in a layout / use modal state |
| `route.ts` route handlers | [defineRoute](/backend/intro#defining-endpoints) in `api/**/index.ts` |
| `middleware.ts` | global [api/use.ts](/backend/middleware#global-middleware-api-use-ts) per app, or  [cascading use.ts](/backend/cascading-middleware) per subtree |
| `"use server"` / Server Actions | an API route + its [fetch client](/fetch/intro) |
| `createServerFn` | ditto |
| tRPC procedures | route name + HTTP method, [typed](/fetch/type-safety) / [validated](/validation/payload) end to end |
| Zod schemas | TypeScript types - [validators are derived](/validation/intro) |
| `validateSearch` | not implemented; validate [query](/validation/payload) on the API contract |
| `routeTree.gen.ts` | nothing to register - filesystem is the [route tree](/routing/intro) |
| `revalidatePath` / `revalidateTag` / ISR | no equivalent - cache at CDN/proxy, or SSG |
| `next/image`, `next/font` | no equivalent - bring your own |
| `next/link` | typed [Link](/frontend/link-navigation) |
| `next/head` / `metadata` | MDX frontmatter, or the SSR entry's `head` |
| `next.config.js` | per-folder [kosmo.config.ts](/essentials/config) (it *is* the Vite config) |
| `next start` | [node dist/run.js -p 4556](/dev-build-run/building-for-production) |
| `.next/` | [dist/&lt;folder&gt;/](/dev-build-run/building-for-production#build-output) |
| multi-zone | multiple [source folders](/essentials/project-structure#inside-a-source-folder) in one project |

## Routing

### `app/page.tsx` and why folders

A route is a **folder with an `index` file**: `pages/users/[id]/index.tsx` -> `/users/:id`.

Only `index` is the route; every sibling file is an obviously-colocated helper.
That is the whole reason for the extra folder - at scale, `schema.ts` next to `page.tsx` is ambiguous, and here it never is.
[Details&nbsp;›](/routing/rationale)

### Params

Different sigils, same concepts - `[id]` required, `{id}` optional, `{...path}` splat.
[Details&nbsp;›](/routing/params)

### `[[...slug]]` - optional catch-all

There is no separate required-vs-optional catch-all.

The splat `{...path}` matches **any number of segments including zero**,
so `docs/{...path}` matches `/docs` as well as `/docs/a/b/c` - covering both `[...slug]` and `[[...slug]]` with one form.
[Details&nbsp;›](/routing/params#splat-parameters)

### `routeTree.gen.ts` - the central route tree

There is no route tree to register or import.

Routing is filesystem-driven; the route config is derived per source folder into `lib/` and handed to the framework's native router.
Treat it as a build artifact - you never edit or read it.
[Details&nbsp;›](/frontend/routing#generated-route-shape)

### `(group)` - route groups

There is no route-group syntax, and none is needed.

Next's `(group)` organizes routes without affecting the URL - a way to separate concerns inside one app.
KosmoJS separates concerns one level up: a [source folder](/essentials/project-structure) is an independent app
with its own framework, base URL, middleware and build.
The separation route groups gesture at is structural here rather than a naming convention.

### `@slot` parallel routes and `(.)` intercepting routes

**No equivalent.** One folder maps to one route.

- *Parallel routes* render several independent pages into named slots of one layout.
Build it by rendering multiple components in a layout and fetching their data independently.

- *Intercepting routes* show a route differently depending on how you arrived (photo-in-a-modal vs. the full page).
Build it with client-side modal state, or your router's modal patterns.

### `loading.tsx` / `error.tsx` / `not-found.tsx`

There are **no per-route special files** for loading and error states - they are handled with each
framework's own primitives rather than a KosmoJS file convention.
Global loading, Suspense and error boundaries belong at the [`app.*`](/frontend/layouts#global-layout-via-app-file) level.

Not-found **does** have a built-in: a [pages/404.*](/frontend/error-pages) component is rendered for unmatched routes.
Backend errors are separate and centralize in [api/errors.ts](/backend/error-handling).

::: tip Suspense is your responsibility
KosmoJS ships no `<Suspense>` boundary on purpose - one app-wide boundary collapses the whole page to a single fallback.
Scope it yourself.
[Details&nbsp;›](/frontend/data-preload#suspense-is-your-responsibility)
:::

### Nested layouts, and do they persist state?

Same idea as `layout.tsx` / `_layout`: a `layout` file wraps its folder and subfolders, nesting by folders.
And yes - navigating between siblings under one layout swaps only the child,
so the layout stays mounted and **its state is preserved**, exactly as in App Router.
It remounts only when navigation leaves its subtree.
[Details&nbsp;›](/frontend/layouts)

### `beforeLoad` and `validateSearch`

There is no proprietary `beforeLoad`-style hook - your framework's primitives are untouched,
so use React Router's `loader`, Solid Router's `preload`, or Vue Router's navigation guards directly.

Client-side typed/validated **search params are not implemented yet** - it's a considered feature.
Query params are validated on the *API contract* (the `query` target, with `VRefine` constraints, surfaced through the fetch clients),
but there is no client-side `validateSearch` typing `useSearch()` on the page route the way TanStack does.
For now, read search params with your framework's native router.
[Details&nbsp;›](/validation/payload#validation-targets)

## Data fetching

### React Server Components and `"use server"`

**No RSC, and no `"use client"` / `"use server"` directive boundary - by design.**

Server code lives in `api/`, client code in `pages/`, and a plain HTTP API sits between them with typed fetch clients across the wire.
There is no interleaving of server and client code in one file and no new mental model to learn: the boundary is the network call.

And with the isomorphic client that boundary is free on the server - during SSR the call runs in-process, with no network layer at all.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

### Server functions / `createServerFn` / Server Actions

**There aren't any, and you don't need them.**

A server function exists to run server-only code from the client without hand-writing an endpoint -
which is exactly what an API route plus its typed client already gives you, with validation and OpenAPI included.

The same client is isomorphic: in-process during SSR, a same-origin request on the client.

Do mutations by defining a normal `POST`/`PUT`/`DELETE` route and calling its client.
Note there is no progressive-enhancement no-JS form submit as a first-class feature,
and no `useFormState`/`useActionState` equivalent - use your framework's form state plus the client's
[validationSchemas](/fetch/validation#validation-schemas) for field errors.

### Can a page read the database directly?

**Not the RSC way** - data flows through the API layer rather than direct DB access in a page.
During SSR this is not a network hop: the isomorphic client dispatches to the backend route `in-process` (no socket),
so you get the API boundary without the round-trip cost.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

### Loaders, and `loaderDeps` / staleness

Loaders work the way you expect: `export loader` on React, Vue, Svelte and MDX,
`export preload` on SolidJS - the loader simply being your fetch client's method exported under the name the router expects.

There is **no built-in loader cache** and no `loaderDeps`/staleness model.
React and Solid reuse the in-flight result for that navigation; Solid's `preload` results are reused by `createAsync`.
For real caching, enable [TanStack Query](/frontend/tanstack-query) - a first-class option.
[Details&nbsp;›](/frontend/data-preload#page-integration)

### `revalidatePath` / `revalidateTag` / ISR

**No equivalent.** No fetch-cache extensions, no tag or path revalidation, no ISR, and no partial prerendering.
Cache at the CDN or proxy layer; use [SSG](/frontend/static-site-generation) for fully static output.
After a mutation, refetch or invalidate your own client cache.

### Does SSR data fetching need plumbing?

No - fetch clients are isomorphic, and each framework's own hydration carries the result to the client, so nothing re-fetches.
You do not wire `dehydrate`/`hydrate` for that.
(TanStack Query is an opt-in layer; serializing *its* cache across SSR is on you.)
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

## Backend

### `route.ts` route handlers / `createAPIFileRoute`

`defineRoute` in `api/**/index.ts`, returning an array of method handlers -
same idea, plus validation and a fetch client for free.

You don't write `Response.json()`, and there is no`NextRequest`/`NextResponse`: it's the native Hono/H3/Koa context.
[Details&nbsp;›](/backend/intro#defining-endpoints)

### `middleware.ts` - global edge middleware

Global middleware lives in [`api/use.ts`](/backend/middleware#global-middleware-api-use-ts) file.
Whatever it default-exports runs for every route in that app, with no registration.

Below it, a [cascading `use.ts`](/backend/cascading-middleware) in any `api/` subfolder wraps everything beneath it,
carrying typed context via `UseT`, and [slots](/backend/middleware#slot-composition) let a route substitute a global default in place.

Three differences from Next's `middleware.ts` are worth knowing before you port anything:

- **It is not at the edge.** It runs in your API server, in the same process as the handlers -
there is no separate edge runtime, and no Web-API-only subset to code against.
- **It is per route, not per request.** Global middleware is composed into each route's chain,
so a request matching no route never reaches it. Rewrites, redirects for unknown URLs,
or blanket header injection belong at the reverse proxy, or on the native app instance in [api/app.ts](/backend/intro#foundation-files).
- **It never sees page requests.** `api/use.ts` covers routes under the folder's `apiBase` only.
Next's `middleware.ts` intercepts page navigations too; there is no client-route interception layer here.
Gate the client side in the global `app.*` wrapper or a [layout](/frontend/layouts) instead -
and remember that a client-side check is UX, not security: the API middleware is what actually enforces it.

### Edge / Cloudflare / Deno / Bun

With Hono and H3 the API runs on Node, Deno, Bun, Cloudflare Workers and edge platforms unchanged via `app.fetch`;
Koa runs through the `node:http` compat layer.
There is **no automatic serverless/edge packaging** like Next's -
you run the bundled server, or wire `app.fetch` into an edge runtime yourself.
[Details&nbsp;›](/dev-build-run/building-for-production#running-the-api-server)

### Auth

There is no bundled auth and no NextAuth integration. Any Hono/H3/Koa middleware works unchanged -
verify a token in a `use.ts` and set `ctx.state.user` / `ctx.set("user")`.
[Details&nbsp;›](/backend/cascading-middleware#common-use-cases)

## Validation & types

### "Does it use Zod?"

No - and you don't hand-write schemas at all.

TypeScript types are converted to JSON Schema and compiled to TypeBox validators automatically,
so one type definition drives compile-time types, runtime validation, the fetch client and the OpenAPI spec.

There is no schema to drift from your types.
[Details&nbsp;›](/validation/intro)

The trade-off worth knowing: you give up schema-level *transforms* and custom refinement functions,
and you get constraints declaratively through [`VRefine`](/validation/refine) instead.
Do transformation in the handler, where it's plain code.

### tRPC-style end-to-end type safety

Effectively yes, through typed fetch clients - params, payload and response types all derive from the same route definition,
with client-side validation before the request.
The difference is that it's **route-based** (path key + HTTP method) rather than procedure-based,
and it comes with automatic [runtime validators](/validation/intro) and [OpenAPI spec](/openapi),
which tRPC does not produce natively.
[Details&nbsp;›](/fetch/intro)

### Compile-time or runtime?

Both, from one definition - which is the main difference from TanStack Router's compile-time-only route typing.
The generated validators run on real requests.
[Details&nbsp;›](/essentials/why-codegen)

## Rendering

The dev server always renders on the client - Vite with HMR, for the fastest feedback loop available.
That is the **development** mode, not a rendering philosophy: it says nothing about what a folder ships.

In production, each folder picks its own mode:

- **CSR** - a static client bundle served alongside the API.
- **[SSR](/frontend/server-side-render)** - opt in per folder, then string- or stream-rendered per route.
- **[SSG](/frontend/static-site-generation)** - pre-rendered HTML at build time, available on every frontend. The closest thing to `output: export`.

Because dev never server-renders, the [preview command](/dev-build-run/production-preview) is the step before you ship:
it builds and serves the real production output - server-rendered pages, hashed assets, the production validation policy -
on its own port, so it can sit next to the dev server.

Migrators trip on this more than anything else, so make preview part of the loop rather than a last resort.

There is **no ISR, no on-demand revalidation and no partial prerendering**,
and islands / partial hydration is not offered as a named feature.

For `<head>`: MDX frontmatter drives it, or the SSR entry's returned `head`.
There is no `metadata` / `generateMetadata` export convention.

## Project & tooling

### `next.config.js`

Per-folder [`kosmo.config.ts`](/essentials/config), which **is** the Vite config for that folder -
it takes `plugins`, `resolve`, `css` and everything else `UserConfig` takes,
alongside the KosmoJS options. There is no separate `vite.config.ts` and no project-wide kosmo config.

### `.next/` and `next start`

Build output is `dist/<folder>/` with `api/`, `client/`, `ssr/` and `ssg/` subdirectories, plus a `dist/run.js` dispatcher.
The `next start` equivalent is `node dist/run.js -p 4556` - one process serving every source folder.
It's `node:http`, so `bun` and `deno run -A` work too.
[Details&nbsp;›](/dev-build-run/building-for-production)

### `next/image` and `next/font`

**No equivalent** - there is no image optimization or font pipeline. Bring your own.

### `next/link`

The typed [Link](/frontend/link-navigation) component whose `to` prop is a `[routeName, ...params]` tuple,
so renaming a route directory turns every stale link into a compile error.

### Multi-zone

The source-folder model *is* the multi-app story: per-folder base URLs, frameworks and builds inside one project, sharing types and a database layer directly.
Where Next stitches separate deployments together with multi-zone, KosmoJS keeps the apps in one codebase with no zone configuration.

### Deployment lock-in

None. It's a standard Node/Vite app - deploy the bundled servers to Node, Bun, Deno or the edge yourself.
You can deploy to Vercel as a Node app, but there are no Vercel-specific features and no dependence on them.

## What you gain

Worth naming, since it's the other half of the trade: generated **runtime validators** from your TypeScript types,
**typed fetch clients** with client-side validation, automatic **OpenAPI 3.1**,
and **multi-app orchestration** in one project - several frameworks side by side,
sharing types with no workspace protocols, each building and deploying independently.

[What KosmoJS is&nbsp;›](/about) · [Feature overview&nbsp;›](/features)
