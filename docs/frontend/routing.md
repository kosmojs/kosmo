---
title: Frontend Routing
description: >-
    How pages are routed in KosmoJS - folders become URLs, page and layout files become nested routes,
    and the framework's own router does the matching.
    Params, layouts, lazy loading, data loading and typed navigation for React, Solid, Vue, Svelte and MDX.
head:
  - - meta
    - name: keywords
      content: react routing, solidjs routing, vue routing, svelte routing, mdx routing,
        lazy components, loader integration, preload function, route parameters,
        code splitting, dynamic imports, nested routes, layout components,
        route hierarchy, outlet pattern, router view, kosmojs routing
---

On the frontend, a route is a **page component**,
optionally wrapped in **layouts** inherited from the folders above it.

You never register any of it. The dev server watches `pages/` dir,
and as pages are created, renamed or deleted,
a matching route configuration is written into `lib/` for your framework's router to consume.

This page covers the frontend specifics. The shared fundamentals are in
<span class="text-nowrap">[Directory-Based Routing](/routing/intro)</span>,
and the parameter syntax is in [Parameters](/routing/params).
For how API routes are resolved, see <span class="text-nowrap">[Backend Routing](/backend/routing)</span>.

## One folder, one page

~~~txt
pages/
├── index/
│   └── index.tsx             ->  /
├── users/
│   ├── index.tsx             ->  /users
│   ├── types.ts              ->  helper, not a route
│   └── [id]/
│       └── index.tsx         ->  /users/:id
├── dashboard/
│   ├── layout.tsx            ->  wraps /dashboard and everything below
│   ├── index.tsx             ->  /dashboard
│   └── settings/
│       ├── layout.tsx        ->  wraps /dashboard/settings and below
│       └── index.tsx         ->  /dashboard/settings
└── docs/
    └── {...path}/
        └── index.tsx         ->  /docs/*
~~~

Only two filenames carry meaning inside `pages/`:

| File | Role |
|---|---|
| `index.<ext>` | Defines the page. Its folder path is the URL. |
| `layout.<ext>` | Wraps this folder's pages and everything beneath it. |

Everything else in a route folder - components, styles, types, tests - is yours.
It is never scanned and never mistaken for a page.

The extension depends on the framework the source folder runs.

| | React | Solid | Vue | Svelte | MDX |
|---|---|---|---|---|---|
| Page | `index.tsx` | `index.tsx` | `index.vue` | `index.svelte` | `index.mdx` / `index.md` |
| Layout | `layout.tsx` | `layout.tsx` | `layout.vue` | `layout.svelte` | `layout.mdx` |

A folder ignores other frameworks' files: a Vue folder skips `.tsx`, a React folder skips `.vue` and `.svelte`.
<span class="text-nowrap">[Full support matrix ›](/essentials/frameworks#frontends)</span>

## The URL prefix

The folder path is only half of the URL. The other half is `frontend.base` from the source folder's config:

```txt
page URL = join(frontend.base, pagePath)
```

```ts [kosmo.config.ts]
export default defineConfig({
  frontend: {
    stack: "react",
    base: "/admin",
  },
});
```

`frontend.base` is a **full path**, independent of `backend.base`.
When several source folders share one server, requests are dispatched by prefix, longest first -
a folder at `base: "/"` catches only what no other folder claims.

## Pages are components

A page default-exports a component. Write it as a **named function**:

```tsx [pages/users/index.tsx]
export default function UserPage() {
  return <h1>User</h1>;
}
```

An anonymous arrow (`export default () => ...`) may break Vite's HMR.

You rarely write the file from scratch: create it **empty** and the dev server seeds the correct boilerplate.
To control what gets seeded, use <span class="text-nowrap">[custom templates](/frontend/custom-templates)</span>.

## Parameters

The three syntaxes - required `[id]`, optional `{id}`, splat `{...path}` - are the same as on the backend:

| Syntax | Example | Matches |
|---|---|---|
| `[id]` | `pages/users/[id]/` | `/users/123` |
| `{id}` | `pages/users/{id}/` | `/users` and `/users/123` |
| `{...path}` | `pages/docs/{...path}/` | `/docs/any/depth` |

What differs is how a component **reads** them - and that belongs to the framework's router.

| | Read params with |
|---|---|
| React | `react-router` hooks |
| SolidJS | `@solidjs/router` |
| Vue | `vue-router` |
| Svelte, MDX | `useParams()` from [`_/use`](/frontend/hooks) |

:::info `_/use` does not exist everywhere
The `_/use` module exists only in Vue, Svelte and MDX folders.
In React and SolidJS the import does not resolve at all - use the router's own hooks.
[Details&nbsp;›](/frontend/hooks)
:::

### Matching rules

* **Static beats dynamic.** `users/me` wins over `users/[id]` for `/users/me`.
* **Optional parameters must not be followed by required ones.**
  `users/{section}/{subsection}` is fine; `users/{optional}/[required]` is not.
* **An optional segment before a static one can swallow it.** With `properties/{city}/filters`,
  `/properties/filters` binds `{city}` to `"filters"` and 404s. Add an explicit static sibling
  (`properties/filters/index.tsx`) and static priority resolves it.
* **A sibling `index` makes `[id]` effectively optional.** With both `careers/index.tsx` and `careers/[jobId]/index.tsx`,
  there is already a fallback for `/careers`, so `{jobId}` and `[jobId]` behave the same.

[Details&nbsp;›](/routing/params.md#watch-out-for-ambiguous-paths)

### Keep frontend routes simple

Mixed segments (`files/[name].[ext]`) and power syntax are backend-friendly, but frontend routers differ:

| | React | SolidJS | Vue | Svelte | MDX |
|---|---|---|---|---|---|
| Mixed segments | ⚠️ `.ext` suffix only | ❌ | ✅ | ✅ | ✅ |
| Power syntax | ❌ | ❌ | ❌ | ❌ | ❌ |

The practical rule: stay with plain syntaxes on pages, and use mixed segments on the API side.

[Support matrix ›](/essentials/frameworks.md#routing-syntax-support)

## Layouts

Layouts wrap groups of pages with shared UI - navigation, sidebars, auth shells - at any level of the hierarchy.
A request to `/dashboard/settings` renders, outermost first:

```txt
pages/layout.tsx                       (if present)
  pages/dashboard/layout.tsx
    pages/dashboard/settings/layout.tsx
      pages/dashboard/settings/index.tsx
```

Layouts stack outward-in and cannot be escaped by child routes.
Moving a folder moves the layouts it inherits with it - the structure is the wiring.

A layout renders its children with whatever the framework uses for it:

| | React | Solid | Vue | Svelte | MDX |
|---|---|---|---|---|---|
| Renders children with | `<Outlet/>` | `props.children` | `<RouterView/>` | `{@render children()}` | `props.children` |

[More on layouts ›](/frontend/layouts)

## Lazy loading

All page components are lazy-loaded by default. Route code stays out of the initial bundle
and is fetched when a user navigates to that path, so users download only the routes they visit.
There is nothing to configure.

## Data loading on navigation

Every framework ties data fetching to the route lifecycle through a page-level export,
so data is requested on navigation intent rather than after the component mounts:

| | Export | Read it with | Notes |
|---|---|---|---|
| React | `loader` | `useLoaderData` (react-router) | Runs on initial load, link hover and navigation start |
| Solid | `preload` | `createAsync` | Wrap the fetch in `query()` so both share one cache key; needs `<Suspense>` |
| Vue | `loader` | `useLoaderData()` from `_/use` | Runs in a navigation guard, before render |
| Svelte | `loader` | `useLoaderData()` from `_/use` | Exported from the module `<script>` block |
| MDX | `loader` | `useLoaderData()` from `_/use` | Runs before render |

Loader results are serialized during SSR and reused on hydration, so a request made on the server is not repeated on the client.
[Details&nbsp;›](/frontend/data-preload)

## Navigating between routes

Plain anchors work, but the typed `Link` component knows your routes.
It takes the route name, then params in path order, plus an optional `query`:

```tsx
<Link to={["users/[id]", 123]} query={{ tab: "posts" }}>Profile</Link>
```

TypeScript enforces the route name and param types, so renaming a route folder surfaces an error
at every stale `Link` - the same refactor-as-a-checklist property the backend
[route&nbsp;name](/backend/routing.md#the-route-name) gives you.

[Details&nbsp;›](/frontend/link-navigation)

## Routes are derived, and native

There is no central route tree to register or maintain - no `routeTree.gen.ts`, no route config object to keep in sync.
Definitions are written into `lib/<folder>/`, and you reach them only through `createRoutes()` in your entry file,
which the seeded boilerplate already wires up.

* **React, Solid, Vue** - a plain, framework-native route definition, the same object you would have written by hand.
* **Svelte, MDX** - there is no third-party router, so KosmoJS supplies the matcher and emits its own `RawRoute` shape.

Because the output is native, everything your router documents keeps working:
lazy loading, nested layouts, navigation guards, `loader` and `preload`, error elements.
`path-to-regexp` runs only at build time; at runtime the routes are registered with the framework's own router.

[Details&nbsp;›](/routing/intro.md#native-routing-under-the-hood)

## Quick reference

| You want | You write |
|---|---|
| A page at `/orders` | `pages/orders/index.tsx` (extension per framework) |
| The root page `/` | `pages/index/index.tsx` |
| A required / optional / catch-all segment | `[id]` / `{id}` / `{...path}` |
| Shared UI for a section | A `layout.<ext>` in that section's folder |
| Data before render | A `loader` (`preload` in Solid) export on the page |
| A typed link | `<Link to={["users/[id]", 123]} />` |
| A helper next to a page | Any file other than `index.<ext>` / `layout.<ext>` |
