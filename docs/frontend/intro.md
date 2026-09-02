---
title: Framework Integration
description: Integrate KosmoJS directory-based routing with React, SolidJS, Vue, Svelte, or MDX.
  Automatic route configuration, type-safe navigation, and optimized lazy loading
  for modern frontend applications.
head:
  - - meta
    - name: keywords
      content: react integration, solidjs generator, vue generator, svelte generator, mdx content,
        automated routing, code splitting, type-safe navigation, lazy loading
---

Every source folder runs one frontend framework - **React**, **SolidJS**, **Vue**, **Svelte** or **MDX** -
picked when you create the folder. Different folders can run different ones in the same project.

Whichever you choose, the shape of the work is the same: components under `pages/` become the routes,
navigation and data loading are typed end to end, and page code is split automatically.

Nothing about the framework itself changes -
you keep its router, its reactive model and its ecosystem, exactly as documented upstream.

## What's in the Folder

These are the files that make the folder an application.
Every one is a real source file you own: written once when the folder is created, never regenerated behind your back,
and - unlike page route files - never seeded through [custom templates](/frontend/custom-templates#what-it-overrides).

```text
src/<folder>/
├── kosmo.config.ts       -> this folder's config (and its Vite config)
├── tsconfig.json         -> extends lib/front/tsconfig.json
├── index.html            -> Vite's HTML entry
├── app.tsx               -> global wrapper around EVERY route
├── router.ts             -> wires routes into the native router
│
├── entry/
│   ├── client.ts         -> mount vs hydrate, in the browser
│   └── server.ts         -> renderToString / renderToStream  (SSR only)
│
├── components/
│   └── Link.tsx          -> typed Link component
│
└── pages/
    ├── 404.tsx           -> rendered for unmatched routes
    ├── index/
    │   └── index.tsx     -> the route  ➜  /
    └── users/
        ├── layout.tsx    -> wraps everything under /users
        └── [id]/
            └── index.tsx -> the route  ➜  /users/:id
```

### Foundation files

| File | What it is | When&nbsp;you&nbsp;touch&nbsp;it |
|---|---|---|
| `app.*` | The **global wrapper**, rendered around every route including `404` - the place for providers, auth gates, analytics, an app-wide error boundary. Not a layout: it has no folder scope, it simply wraps everything. | Providers, global chrome |
| `router.ts` | `routerFactory` - hands your `app` plus the generated routes to the framework's native router, returning `clientRouter()` for browser navigation and `serverRouter(url)` for SSR. | Rarely |
| `entry/client.*` | The browser entry, referenced from `index.html`. `renderFactory` picks `mount()` (fresh render) or `hydrate()` (SSR markup already present) automatically. | Rarely |
| `entry/server.*` | The SSR entry, exporting `renderToString` and - where the framework supports it - `renderToStream`. Only present when SSR is enabled. | Injecting SSR assets into `head` |
| `components/Link.*` | The typed [Link](/frontend/link-navigation) component: `to` takes a `[routeName, ...params]` tuple, so renaming a route directory becomes a compile error at every call site. | Styling it |
| `index.html` | Vite's HTML entry, loading `entry/client`. | Meta tags, fonts, the mount node |
| `tsconfig.json` | Extends the generated `lib/<folder>/tsconfig.json`, which carries JSX and path settings. Anything you set here wins. | [Relaxing strictness](/backend/type-safety) |
| `kosmo.config.ts` | The folder's [configuration](/essentials/config) - `base`, `apiBase`, generators, and any Vite option. | Adding generators or Vite plugins |

### Inside `pages/`

| File | What&nbsp;it&nbsp;is |
|---|---|
| `<route>/index.*` | **The route**. Its folder path becomes the URL. |
| `<route>/layout.*` | Wraps that folder and everything beneath it. Only works **inside a route folder**. [Details&nbsp;›](/frontend/layouts) |
| `404.*` | The catch-all [error page](/frontend/error-pages) for unmatched URLs. |
| anything&nbsp;else | A colocated helper - never a route. |

### Extensions per framework

`router.ts` and `entry/*` are always `.ts`; everything else follows the framework:

| | React | SolidJS | Vue | Svelte | MDX |
|---|:---:|:---:|:---:|:---:|:---:|
| App file | `app.tsx` | `app.tsx` | `app.vue` | `app.svelte` | `app.mdx` |
| Page | `index.tsx` | `index.tsx` | `index.vue` | `index.svelte` | `index.mdx` / `.md` |
| Layout | `layout.tsx` | `layout.tsx` | `layout.vue` | `layout.svelte` | `layout.mdx` |
| Error&nbsp;page | `404.tsx` | `404.tsx` | `404.vue` | `404.svelte` | `404.mdx` |
| `Link` | `Link.tsx` | `Link.tsx` | `Link.vue` | `Link.svelte` | `Link.tsx` |
| Extra | – | – | – | – | `components/mdx.ts` (component map) |

A source folder runs exactly one framework and ignores the others' files - a Vue folder never picks up a stray `.tsx` page.
[Full&nbsp;matrix&nbsp;›](/essentials/frameworks#frontends)

Derived code - the route table, fetch clients, validators - lives in `lib/`, is git-ignored,
and is not something you read to learn the project. [Why&nbsp;codegen&nbsp;›](/essentials/codegen)

## TypeScript Configuration

Mixing frameworks across source folders requires per-folder TypeScript
configuration. Each framework has its own JSX import source requirement:

| Framework | `jsxImportSource` |
|-----------|-------------------|
| React | `"react"` |
| SolidJS | `"solid-js"` |
| Vue | `"vue"` *(only when using JSX)* |
| Svelte | n/a *(no JSX - compiled from `.svelte`)* |
| MDX | `"preact"` |

`KosmoJS` delegates JSX transformation to Vite, not TypeScript -
but differing `jsxImportSource` values cause type
conflicts when multiple frameworks coexist in the same project.

Solved by generating a `tsconfig.json` specific to each source folder,
placed in the `lib/` directory for the source folder to extend:

```json [src/front/tsconfig.json]
{ "extends": "../../lib/front/tsconfig.json" }
```

Each config supplies the correct `jsxImportSource`, path mappings, and core settings.

## What Differs Between Frameworks

Routing, layouts, validation and the fetch clients behave identically everywhere.
Data loading, streaming support, SSG, TanStack Query and the exotic routing syntaxes do not -
those differences are collected in one table:

[Framework Support Matrix ›](/essentials/frameworks#frontends)
