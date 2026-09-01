---
title: Framework Support Matrix
description: What each backend and frontend framework supports in KosmoJS - mixed segments,
    power syntax, streaming SSR, SSG, TanStack Query, layouts, data loading and hooks - in one table.
head:
  - - meta
    - name: keywords
      content: framework comparison, hono h3 koa, react solid vue svelte mdx, mixed segments,
        power syntax, streaming ssr, ssg support, tanstack query support, framework matrix
---

Routing conventions, validation, middleware composition and the fetch clients are **identical across every framework**.

This page is about the places where they aren't -
gathered here so you can choose a stack without hunting through six pages of info boxes.

## Backends

| | Hono | H3 | Koa |
|---|:---:|:---:|:---:|
| Runtimes | Node · Deno · Bun · Workers · edge | Node · Deno · Bun · edge | Node (Deno/Bun via `node:http` compat) |
| Handler style | return `ctx.json()` / `ctx.text()` | return the value directly | mutate `ctx.body` |
| Raw params | `ctx.req.param()` | `event.context.params` | `ctx.params` |
| Validated params | `ctx.validated.params` | `ctx.validated.params` | `ctx.validated.params` |
| Route-specific types | Variables, Bindings | Context | State, Context |
| Global types (`api/env.d.ts`) | `DefaultVariables`, `DefaultBindings` | `DefaultContext` | `DefaultState`, `DefaultContext` |
| Error entry point | `app.onError()` | `app.use(onError(...))` | middleware around `await next()` |
| [Mixed segments](/routing/params#mixed-segments) | ⚠️ partial | ⚠️ partial | ✅ full |
| [Power syntax](/routing/params#power-syntax) | ⚠️ matches, params renamed `_0abc` | ❌ won't match | ✅ full |

**Choosing:** take Hono for maximum performance and the widest runtime reach;
H3 for the same, with a stronger Web-standards focus;
Koa for a mature Node ecosystem - and it is the only backend with complete mixed-segment and power-syntax support.

[Details&nbsp;›](/backend/intro)

## Frontends

| | React | SolidJS | Vue | Svelte | MDX |
|---|:---:|:---:|:---:|:---:|:---:|
| Page extension | `.tsx` | `.tsx` | `.vue` | `.svelte` | `.mdx` / `.md` |
| Layout file | `layout.tsx` | `layout.tsx` | `layout.vue` | `layout.svelte` | `layout.mdx` |
| Renders children with | `<Outlet/>` | `props.children` | `<RouterView/>` | `{@render children()}` | `props.children` |
| `jsxImportSource` | `react` | `solid-js` | `vue` *(JSX only)* | n/a | `preact` |
| Data loading export | `loader` | `preload` | `loader` | `loader` | `loader` |
| Reading loaded data | `useLoaderData` *(react-router)* | `createAsync` | `useLoaderData` *(`_/use`)* | `useLoaderData` *(`_/use`)* | `useLoaderData` *(`_/use`)* |
| Needs `<Suspense>` | ❌ | ✅ | ❌ | ❌ | ❌ |
| [`_/use` module](/frontend/hooks) | ❌ | ❌ | ⚠️ `useLoaderData` only | ✅ | ✅ |
| [Streaming SSR](/frontend/server-side-render#stream-rendering) | ✅ | ✅ | ✅ | ❌ | ❌ |
| [SSG](/frontend/static-site-generation) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [TanStack Query](/frontend/tanstack-query) | ✅ | ✅ | ✅ | ✅ | ❌ |
| TanStack read hook | `useQuery(opts)` | `useQuery(() => opts)` | `useQuery(opts)` | `createQuery(() => opts)` | – |
| [Mixed segments](/routing/params#mixed-segments) | ⚠️ `.ext` suffix only | ❌ | ✅ | ✅ | ✅ |
| [Power syntax](/routing/params#power-syntax) | ❌ | ❌ | ❌ | ❌ | ❌ |

### Reading the exceptions

- **SolidJS is the only frontend that needs a `<Suspense>` boundary** in the common case.
`createAsync` suspends; the other frameworks' loaders resolve before render.
`KosmoJS` ships no boundary for you - scoping it is your call.
[Why&nbsp;›](/frontend/data-preload#suspense-is-your-responsibility)
- **Svelte and MDX render to strings only.** They implement `renderToString` but not `renderToStream`,
and their folders don't accept the streaming [`renderMode`](/frontend/server-side-render#selecting-the-render-mode).
- **MDX has no client runtime**, so TanStack Query is unavailable there. Fetch with an MDX `loader` instead.
- **Svelte does not use SvelteKit.** `KosmoJS` uses only Svelte's UI layer,
so data loading is the `loader` export, not SvelteKit's `load`, and there are no `+page` files.

## Routing Syntax Support

The parameter syntaxes are the same everywhere; only the exotic ones vary.

| Syntax | Example | Everywhere? |
|---|---|---|
| Required `[id]` | `users/[id]` | ✅ all backends and frontends |
| Optional `{id}` | `users/{id}` | ✅ all backends and frontends |
| Splat `{...path}` | `docs/{...path}` | ✅ all backends and frontends |
| Mixed segment | `files/[name].[ext]` | ⚠️ see tables above |
| Power syntax | `book{-:id}-info` | ⚠️ Koa only |

**Practical rule:** keep frontend routes to the three plain syntaxes.
Use mixed segments on the API side, where support is complete on Koa and workable on Hono/H3.
Reach for power syntax only on a Koa backend.

[Parameter details ›](/routing/params)

## Mixing Frameworks

Support differences are per **source folder**, not per project -
a folder runs exactly one frontend and at most one backend.
So the differences above are choices you make per app, not constraints you carry project-wide:

```txt
src/
├── marketing/    MDX + SSG        → static, no backend
├── app/          React + Hono     → SSR, streaming, TanStack Query
└── admin/        Vue + H3         → CSR
```

A folder also ignores other frameworks' files: a Vue folder skips `.tsx`,
a React folder skips `.vue`/`.svelte`. [Details&nbsp;›](/frontend/intro#multi-folder-architecture)
