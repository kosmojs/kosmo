---
title: Error Pages
description: The pages/404 component KosmoJS renders for unmatched routes -
    where it lives per framework, how it is registered as the router's catch-all,
    and how it behaves under CSR, SSR and SSG, including which HTTP status each one returns.
head:
  - - meta
    - name: keywords
      content: 404 page, not found page, custom 404, unmatched route, catch-all route,
        not-found.tsx equivalent, error pages, 404.tsx, 404.vue, 404.svelte, 404.mdx,
        ssr 404 status, spa fallback, kosmojs error pages
---

An **error page** is a full-page route rendered when a request can't be satisfied.

It is distinct from an [error boundary](/frontend/error-boundaries),
which catches a *rendering* error inside an otherwise-working page,
and from [`api/errors.ts`](/backend/error-handling), which handles failures on the API side.

Today there is exactly one error page: **404**. The `pages/<code>.*` shape is deliberate,
so more can join it later without changing the convention.

## The 404 page

Every frontend source folder gets one, at the root of `pages/`:

| Framework | File |
|---|---|
| React | `pages/404.tsx` |
| SolidJS | `pages/404.tsx` |
| Vue | `pages/404.vue` |
| Svelte | `pages/404.svelte` |
| MDX | `pages/404.mdx` |

It is **seeded once when the folder is created**, carrying a placeholder you are expected to replace.
From that point it is an ordinary source file: it is never regenerated,
never overwritten by a later boilerplate pass, and - unlike route files - it cannot be seeded through
[custom&nbsp;templates](/frontend/custom-templates#what-it-overrides). Edit it directly.

:::tabs key:frontend variant:code
== React
```tsx
// pages/404.tsx
export default function NotFound() {
  return (
    <main>
      <h1>404 - Not Found</h1>
      <a href="/">Back home</a>
    </main>
  );
}
```
== Solid
```tsx
// pages/404.tsx
export default function NotFound() {
  return (
    <main>
      <h1>404 - Not Found</h1>
      <a href="/">Back home</a>
    </main>
  );
}
```
== Vue
```vue
<!-- pages/404.vue -->
<template>
  <main>
    <h1>404 - Not Found</h1>
    <a href="/">Back home</a>
  </main>
</template>
```
== Svelte
```svelte
<!-- pages/404.svelte -->
<main>
  <h1>404 - Not Found</h1>
  <a href="/">Back home</a>
</main>
```
== MDX
```mdx
{/* pages/404.mdx */}
# 404 - Not Found

[Back home](/)
```
:::

## How it is registered

The generator appends it to the folder's route list as the router's **catch-all (`path: "*"`), always last**,
so it matches only after every real route has failed to.

You never register it yourself and it never appears in the [typed Link](/frontend/link-navigation) route map -
there is no route name to link to.

Two consequences worth knowing:

- **The app file wraps it; layouts do not.** The catch-all is a top-level sibling of your routes,
so [app.*](/frontend/layouts#global-layout-via-app-file) - your global shell, nav, providers -
still renders around it, but no `layout.*` does.
A 404 under `/dashboard/anything` gets the app shell, not the dashboard layout.

- **It is lazy-loaded on the client** like any other page, and imported eagerly into the SSR bundle
so the server can render it without a dynamic import.

## CSR, SSR and SSG

The same component is used in every mode - what differs is the **HTTP status** the visitor actually receives:

| Mode | Renders the page | HTTP status |
|---|---|---|
| CSR | ✅ client router matches the catch-all | whatever served the SPA fallback - normally **200** |
| SSR | ✅ rendered on the server | **404** |
| SSG | ❌ no `404.html` is emitted | your static host decides |

::: warning A client-rendered 404 is not a 404 to a crawler
Under CSR the host has already answered - typically `200 OK` with `index.html` - before your router decides nothing matched.
The visitor sees the right page; a crawler or an uptime check sees a success.
If correct status codes matter (SEO, monitoring), either enable [SSR](/frontend/server-side-render) for that folder,
or configure the fallback at the host/proxy level to return 404 for unknown paths.
:::

For [SSG](/frontend/static-site-generation) folders, nothing is pre-rendered for unmatched paths -
static hosts have their own not-found configuration (`404.html` on GitHub Pages and Netlify, `error_page` in Nginx, and so on).
Point it at whatever your host expects.

## What the 404 page is not

- **Not for API 404s.** A missing record behind `/api/users/[id]` is a backend concern:
return a declared `[404, "json", ...]` response variant, or let it reach [api/errors.ts](/backend/error-handling).
Requests under `apiBase` never render a page.
- **Not a render-error handler.** If a page throws while rendering,
that is an [error boundary](/frontend/error-boundaries)'s job.
The 404 page only ever renders because *routing* found nothing.
- **Not `not-found.tsx`.** There is no per-route not-found convention as in Next's App Router -
one 404 page serves the whole source folder.
Different folders have their own, which is usually the distinction you actually wanted.
[Migration&nbsp;Tips&nbps;›](/essentials/migration-tips#loading-tsx-error-tsx-not-found-tsx)

## Triggering it deliberately

There is no `notFound()` helper. A route that exists but has nothing to show is a normal render decision -
branch in the component and render your own not-found UI, or redirect.
The catch-all page is reserved for URLs that match no route at all.
