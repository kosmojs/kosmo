---
title: Project Structure
description: The anatomy of a KosmoJS project - source folders, the generated lib directory,
    build output, and the reserved @/ ~/ _/ path mappings.
head:
  - - meta
    - name: keywords
      content: project structure, source folders, lib directory, generated code, path mappings,
        path aliases, tsconfig paths, dist output, kosmojs layout, var cache
---

A `KosmoJS` project has four top-level directories, and each one has exactly one job.
Once that clicks, the rest of the docs read much faster.

```txt
my-app/
├── package.json          -> project settings: distDir, devPort, previewPort, scripts
├── tsconfig.json         -> { "extends": "./lib/tsconfig.json" }
│
├── src/                  ✍️  YOU WRITE THIS
│   ├── front/            ->   one source folder
│   └── admin/            ->   another, fully independent
│
├── lib/                  🤖 GENERATED - never edit, don't read to learn
│   ├── tsconfig.json     ->   base config the root tsconfig extends
│   ├── front/            ->   generated code for src/front
│   └── admin/            ->   generated code for src/admin
│
├── dist/                 📦 BUILD OUTPUT
│   ├── run.js            -> runs every folder, one process
│   ├── front/
│   └── admin/
│
└── var/                  🗑️  Vite cache - disposable
```

The rule of thumb: **you own `src/`, `KosmoJS` owns `lib/`.**
Every `_/` import you write points into `lib/`.

## Inside a Source Folder

A source folder is a self-contained app. This is one with a Hono backend and a React frontend,
with SSR enabled - the fullest shape:

```txt
src/front/
├── kosmo.config.ts       -> what this folder is
├── tsconfig.json         -> { "extends": "../../lib/front/tsconfig.json" }
├── index.html            -> Vite's HTML entry
├── app.tsx               -> global wrapper, wraps EVERY route
├── router.ts             -> routerFactory: routes ➜ native router
│
├── api/                  ── server side ───────────────────────────
│   ├── app.ts            -> the backend app instance (appFactory)
│   ├── server.ts         -> standalone server entry
│   ├── dev.ts            -> dev hooks: requestHandler, teardownHandler
│   ├── errors.ts         -> THE central error handler
│   ├── use.ts            -> global middleware (runs for every route)
│   ├── env.d.ts          -> global context/state types, custom UseSlots
│   └── users/
│       └── [id]/
│           ├── index.ts  -> the route  ➜  /api/users/:id
│           └── types.ts  -> colocated helper, NOT a route
│
├── pages/                ── client side ───────────────────────────
│   ├── 404.tsx           -> rendered for unmatched routes
│   ├── index/
│   │   └── index.tsx     -> the route  ➜  /
│   └── users/
│       ├── layout.tsx    -> wraps everything under /users
│       └── [id]/
│           └── index.tsx -> the route  ➜  /users/:id
│
├── components/
│   └── Link.tsx          -> generated typed Link
│
└── entry/
    ├── client.ts         -> mount / hydrate in the browser
    └── server.ts         -> renderToString / renderToStream  (SSR only)
```

Things worth noticing:

- **`api/` and `pages/` are siblings** with parallel trees,
so an endpoint and its page are always one folder apart.
Neither directory name appears in a URL.
- **Only `index.*` is a route.** Everything else in a route folder is a colocated helper.
[Rationale&nbsp;›](/routing/rationale)
- **`app.*` is not a layout.** It sits at the folder root and wraps every route;
`layout.*` files live inside `pages/**/*` and wrap a subtree.
[Details&nbsp;›](/frontend/layouts#global-layout-via-app-file)
- **`use.ts` is not a route either.** Drop one in any `api/` folder and it wraps that subtree.
[Details&nbsp;›](/backend/cascading-middleware)

A folder created with `--no-backend` simply has no `api/`;
one created with `--no-framework` has no `pages/`, `app.*`, `router.ts`, `index.html` or `entry/`.

## Inside `lib/`

You never edit `lib/`, but knowing what lives there makes the `_/` imports legible.
This is a React + Hono folder; exact filenames vary by framework,
while the `_/` names you import stay the same:

```txt
lib/
├── tsconfig.json         -> shared base for the root tsconfig
├── .gitignore            -> why lib/ is NOT in the root .gitignore
└── front/
    ├── tsconfig.json     -> this folder's jsxImportSource + path mappings
    ├── api.ts            -> _/api          defineRoute, use
    ├── api:factory.ts    -> _/api:factory  appFactory, devSetup, errorHandlerFactory
    ├── app.tsx           -> _/app          the AppProvider seam
    ├── router.tsx        -> _/router       routerFactory, createRouters
    ├── query.ts          -> _/query        TanStack client (when enabled)
    ├── use.ts            -> _/use          framework hooks (Vue/Svelte/MDX)
    ├── entry/
    │   ├── client.ts     -> _/entry/client
    │   └── server.ts     -> _/entry/server
    ├── fetch/            -> _/fetch        typed clients + ResponseT
    └── @api/
        └── routes.ts     -> the RouteMap
```

::: tip `lib/` has its own `.gitignore` - don't add it to the root one
The root `.gitignore` deliberately leaves `lib/` alone,
because `lib/.gitignore` handles it more precisely:
it ignores **everything** except `cache.json` and `types.ts` at any depth.

So generated code is *not* committed - it is a build artifact.
What is committed is the per-route generation cache
(`cache.json`, keyed by content hashes of the route file and its type dependencies),
so a fresh clone or a CI run doesn't pay for a full rebuild.

Adding `lib/` to the root ignore file would drop that cache and make every clone slow.
:::

Deleting `lib/` is safe but not free: it forces a full regeneration,
which on a large project takes minutes. [Details&nbsp;›](/validation/performance#when-it-becomes-noticeable)

## Path Mappings

Three prefixes are reserved. Don't reuse them for your own aliases.

| Prefix | Resolves to | Use it for |
|---|---|---|
| `@/*` | project root | anything shared across source folders - db layer, domain types |
| `~/*` | **this** source folder | your own modules inside the folder |
| `_/*` | `lib/<this folder>/` | generated code |

```ts
import { db } from "@/db";                    // my-app/db.ts
import type { User } from "~/types/user";     // src/front/types/user.ts
import { defineRoute } from "_/api";          // lib/front/api.ts
import fetchClients from "_/fetch";           // lib/front/fetch/
```

`~/` and `_/` are **folder-relative**: the same `_/api` in `src/admin` resolves to `lib/admin/api.ts`.
That is what keeps folders isolated - `admin`'s route names and navigation types never leak into `front`.

`@/` is how folders share without packages. Put a type in `db/models.ts`,
import it as `@/db/models` from every folder, change it once, and every folder sees it -
no workspaces, no publishing, no version bumps.

## Build Output

```txt
dist/front/
├── api/
│   ├── app.js            -> the app instance, for custom mounting
│   └── server.js         -> ready-to-run API server
├── client/
│   ├── assets/           -> hashed JS, CSS, images
│   └── index.html
└── ssr/                  -> only when SSR is enabled
    ├── app.js
    ├── server.js         -> serves pages AND the API
    ├── assets/           -> hashed, served at <base>/assets/
    └── public/           -> copy of public/, served at <base>/
```

The simplest way to run all of this is `node dist/run.js`, which dispatches across every folder in one process.
[Details&nbsp;›](/dev-build-run/building-for-production#one-entry-point-for-the-whole-project)

Folders can also be deployed separately, in which case what you deploy depends on the folder's rendering mode -
and for SSR folders it is **not** everything in the directory.
[Details&nbsp;›](/dev-build-run/building-for-production#what-to-deploy)

## Multiple Folders

The point of the whole layout. Three apps, one install, one set of types/helpers:

```txt
src/
├── marketing/    MDX,  no backend,   base "/"
├── app/          React + Hono,       base "/app"
└── admin/        Vue   + H3,         base "/admin"
```

Each has its own `kosmo.config.ts`, its own routes, middleware, layouts and build.
They share one `package.json`, one `node_modules`, and one `@/` root.

```sh
pnpm dev                  # all folders
pnpm dev app              # just one
pnpm build admin          # build one, deploy it independently
```

[Configuration reference ›](/essentials/config) · [Why source folders ›](/about)
