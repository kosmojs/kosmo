---
title: Routing
description: Watch-based route generation, lazy-loaded components, data loading
  integration, and nested layout patterns for React, SolidJS, Vue and MDX applications.
head:
  - - meta
    - name: keywords
      content: react route generation, solidjs routing, vue routing, mdx routing,
        lazy components, loader integration, preload function, route parameters,
        code splitting, dynamic imports, nested routes, layout components,
        route hierarchy, outlet pattern, router view, kosmojs routing
---

Each framework generator continuously watches your `pages` directory. When a
page component is created, the generator analyzes its filesystem location,
produces a corresponding route configuration, and writes it to your `lib`
directory for the router to consume - without any manual wiring.

## 🛣️ Same routing, both sides

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

## 🪆 Layouts

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
[More on Layouts ➜](/frontend/layouts)

## 📦 Lazy Loading

All page components are lazy-loaded by default. Route code is excluded from
the initial JavaScript bundle and fetched on demand when a user navigates to
that path. This keeps initial payloads small, accelerates application startup,
and ensures users download only the code for routes they actually visit.

## 🗺️ Generated Route Shape

The route object written to `lib` differs slightly per framework to match each
router's expected format:

::: code-group

```ts [React]
// React Router receives a flat route definition.
// The loader is wired automatically when your page exports one.
{
  path: "/users/:id",
  lazy: () => import("@/src/front/pages/users/[id]/index.tsx"),
}
```

```ts [SolidJS]
// SolidJS Router receives component and preload as separate keys.
// The preload function is called on link hover and navigation intent.
{
  path: "/users/[id]",
  component: lazy(() => import("@/src/front/pages/users/[id]/index.tsx")),
  preload: () =>
    import("@/src/front/pages/users/[id]/index.tsx").then(
      (mdl) => (mdl as ComponentModule).preload?.()
    ),
}
```

```ts [Vue]
// Vue Router receives a standard lazy route definition.
{
  name: "users/[id]",
  path: "/users/[id]",
  component: () => import("@/src/front/pages/users/[id]/index.vue"),
}
```

:::

## 🔄 Data Loading on Navigation

React and SolidJS integrate data fetching directly into the route lifecycle.

**React** - when a page exports a `loader` function, React Router executes it
at strategic moments: initial page load, link hover, and navigation initiation.
Data is available before the component renders, eliminating loading spinners
for route-level data.

**SolidJS** - when a page exports a `preload` function, SolidJS Router calls it
on link hover and navigation intent. The preload result is cached and reused by
`createAsync` inside the component, so no duplicate requests are made.

**Vue** - preload hooks are not yet part of the Vue generator. Route-level data
fetching is handled through navigation guards in `router.ts` or reactive
`setup()` logic within the component. Prefetching support is under
consideration - contributions are welcome! 🙌
