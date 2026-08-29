---
title: Routing
description: Watch-based route generation, lazy-loaded components, data loading
  integration, and nested layout patterns for React, SolidJS, Vue, Svelte and MDX applications.
head:
  - - meta
    - name: keywords
      content: react route generation, solidjs routing, vue routing, svelte routing, mdx routing,
        lazy components, loader integration, preload function, route parameters,
        code splitting, dynamic imports, nested routes, layout components,
        route hierarchy, outlet pattern, router view, kosmojs routing
---

Each framework generator continuously watches your `pages` directory. When a
page component is created, the generator analyzes its filesystem location,
produces a corresponding route configuration, and writes it to your `lib`
directory for the router to consume - without any manual wiring.

## Same routing, both sides

Frontend routing follows the exact same directory-based pattern as API routing.
If you know how `api/` routes work, you already know how `pages/` routes work:

```
api/users/[id]/index.ts     ➜  /api/users/:id   (backend handler)
pages/users/[id]/index.tsx  ➜  /users/:id       (frontend component)
```

The parallel structure is intentional - an API endpoint and its corresponding
page are always one folder apart. The same parameter syntax applies to both:

| Syntax | Type | Example |
|---|---|---|
| `[id]` | Required | `pages/users/[id]/` ➜ `/users/123` |
| `{id}` | Optional | `pages/users/{id}/` ➜ `/users` or `/users/123` |
| `{...path}` | Splat | `pages/docs/{...path}/` ➜ `/docs/any/depth` |

Static routes always take priority over dynamic ones.
Optional parameters followed by static segments can cause ambiguity -
see [parameter details](/routing/params) for gotchas and solutions.

## Layouts

Layout files wrap groups of pages with shared UI - navigation, sidebars, auth shells -
at any level of the route hierarchy:

```
pages/
  dashboard/
    layout.tsx        - wraps all /dashboard/* pages
    settings/
      layout.tsx      - wraps all /dashboard/settings/* pages
      index.tsx
    index.tsx
```

Layouts stack outward-in and cannot be escaped by child routes.
[More on Layouts ›](/frontend/layouts)

## Generated Route Shape

There is no central route tree for you to register or maintain -
no `routeTree.gen.ts` to import, no route config object to keep in sync.

The generator writes route definitions into `lib/<folder>/` and the framework's own router consumes them;
you reach them only through `createRoutes()` in your entry file, which the scaffold already wires up.

What it emits is a plain, **framework-native** route definition -
the same object you would have hand-written:

:::tabs key:frontend variant:code
== React
```ts
// shape produced for React Router
{
  id: "users/[id]",
  path: "users/:id",
  Component: users_id_component,
  loader: users_id_loader,      // present only when the page exports one
  children: [ /* nested routes and layouts */ ],
}
```

== Solid
```ts
// shape produced for Solid Router
{
  path: "users/:id",
  component: users_id_component,
  load: users_id_preload,       // present only when the page exports one
  children: [ /* nested routes and layouts */ ],
}
```
:::

Two consequences worth internalising:

- **Nesting is structural.** A `layout` file becomes a parent route
whose `children` are the routes beneath it -
which is why layouts stack outward-in and why a child cannot escape one.
- **It is a build artifact.** `lib/` is generated, regenerated on every relevant change,
and bundled like any other dependency at build time.
You don't need to read it, and you should never edit it -
treat it the way you treat a generated Prisma client.
If you do read it (to see exactly what `createRoutes` hands your router, say),
read it as output, not as source.

Because the output is native, everything your router documents keeps working:
lazy loading, nested layouts, navigation guards, `loader`/`preload`, error elements.
[Details&nbsp;›](/routing/intro#native-routing-under-the-hood)

## Lazy Loading

All page components are lazy-loaded by default. Route code is excluded from
the initial JavaScript bundle and fetched on demand when a user navigates to
that path. This keeps initial payloads small, accelerates application startup,
and ensures users download only the code for routes they actually visit.

## Data Loading on Navigation

Every framework integrates data fetching into the route lifecycle through a
page-level `loader`/`preload` export.

**React** - when a page exports a `loader` function, React Router executes it
at strategic moments: initial page load, link hover, and navigation initiation.
Data is available before the component renders, eliminating loading spinners
for route-level data.

**SolidJS** - when a page exports a `preload` function, SolidJS Router calls it
on link hover and navigation intent. The preload result is cached and reused by
`createAsync` inside the component (wrap the fetch in `query()` so both share
one cache key), so no duplicate requests are made.

**Vue** - a page exports a `loader` (from a plain `<script>` block), and the
generated router runs it before the route renders via a navigation guard. The
component reads the result with `useLoaderData()` - no manual guards or
`onMounted` needed.

**Svelte** - a page exports a `loader` (from its module `<script>` block); the
router runs it before render and the component reads it with `useLoaderData()`.

**MDX** - a page exports a `loader`; it runs before render and the page reads
the result with the `useLoaderData()` hook.

Loader results are serialized during SSR and reused on hydration, so a request
made on the server is not repeated on the client.
[More on data loading ›](/frontend/data-preload)
