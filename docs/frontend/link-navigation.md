---
title: Type-Safe Navigation
description: Link component wrapping each framework's router, or a plain anchor on Svelte and MDX,
  with compile-time route validation. Autocomplete navigation targets, parameter
  enforcement, and query string handling for React, SolidJS, Vue, Svelte and MDX.
head:
  - - meta
    - name: keywords
      content: react navigation, solidjs link, vue router link, svelte link, mdx link component,
        type-safe links, route autocomplete, parameter validation, typed navigation.
---

The `Link` component wraps each framework's router link with compile-time route validation.
On Svelte and MDX, which have no third-party router, it renders a plain `<a>`
that KosmoJS navigates client-side. [Details&nbsp;›](#client-side-navigation)
It knows your complete route structure and parameters, delivering autocomplete and type checking throughout navigation code.

The component is available at `components/Link.{tsx,vue,svelte}` in your source folder.

## Usage

The API is consistent across all frameworks - a `to` prop accepting a
typed tuple, an optional `query` prop for search parameters, and standard
router props passed through:

:::tabs variant:code
== Menu.tsx
```tsx
// Menu.tsx
import Link from "~/components/Link";

export default function Menu() {
  return (
    <nav>
      {/* Navigate to a static route */}
      <Link to={["index"]}>Home</Link>

      {/* Navigate with a required parameter */}
      <Link to={["users/[id]", 123]}>User Profile</Link>

      {/* Navigate with a parameter and query string */}
      <Link to={["posts/[slug]", "hello-world"]} query={{ ref: "sidebar" }}>
        Blog Post
      </Link>
    </nav>
  );
}
```

== Menu.vue
```vue
<!-- Menu.vue -->
<script setup lang="ts">
import Link from "~/components/Link.vue";
</script>

<template>
  <nav>
    <!-- Navigate to a static route -->
    <Link :to="['index']">Home</Link>

    <!-- Navigate with a required parameter -->
    <Link :to="['users/[id]', 123]">User Profile</Link>

    <!-- Navigate with a parameter and query string -->
    <Link :to="['posts/[slug]', 'hello-world']" :query="{ ref: 'sidebar' }">
      Blog Post
    </Link>
  </nav>
</template>
```

== Menu.svelte
```svelte
<!-- Menu.svelte -->
<script lang="ts">
import Link from "~/components/Link.svelte";
</script>

<nav>
  <!-- Navigate to a static route -->
  <Link to={["index"]}>Home</Link>

  <!-- Navigate with a required parameter -->
  <Link to={["users/[id]", 123]}>User Profile</Link>

  <!-- Navigate with a parameter and query string -->
  <Link to={["posts/[slug]", "hello-world"]} query={{ ref: "sidebar" }}>
    Blog Post
  </Link>
</nav>
```
:::

## LinkProps Type

The `to` prop is typed as `LinkProps` - a discriminated union derived from
your route structure:

```ts
export type LinkProps =
  | ["index"]
  | ["users/[id]", id: string | number]
  | ["posts/[slug]", slug: string]
  // ... all other routes
```

Typing the first array element triggers TypeScript's IntelliSense with valid
route suggestions. Selecting a parameterized route requires providing those
parameters as subsequent array elements - the type system enforces this.

Renaming a route directory produces TypeScript errors at every `Link`
referencing the old name, turning refactors into an automated checklist.

## Client-Side Navigation

React, SolidJS and Vue navigate through their own routers,
and `Link` is that router's link component.

Svelte and MDX have no third-party router.
There, `Link` renders a plain `<a>`, and KosmoJS intercepts navigations
with the browser's [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API).

One listener covers link clicks, back and forward, `location.assign()`
and GET form submissions, so a hand-written `<a href>` navigates client-side too.

On every navigation the router matches the URL, runs the loaders, then re-renders:

- **Layouts shared by both routes stay mounted**, with their state.
- **The page mounts anew**, even when only the query changed,
so a page reads its route once, at init, and is never stale.
- **Scroll** goes to the top (or the `#fragment`) for a new entry,
and back to where it was for back and forward, once the new page is in the DOM.

What stays a full page load, served by the server:

- a URL no route of this source folder matches -
another source folder, or a missing page, which gets the server's 404;
- a fragment-only change, a download, a POST form and a reload;
- a link marked `data-reload`, for a page that must come from the server:

```svelte
<Link to={["reports/export"]} data-reload>Export</Link>
```

`data-reload` is read through `NavigateEvent.sourceElement`, still marked experimental.
A browser that does not expose it navigates such a link client-side.

A click that starts a newer navigation before the previous one rendered
aborts the previous one: its loaders get an aborted `signal`,
and it never renders over the newer page.
[Details&nbsp;›](/frontend/data-preload#cancelled-navigations)

If resolving fails - a route chunk that no longer exists after a deploy, a loader that throws -
the page reloads, so the server renders the URL the address bar already shows.

::: info Browsers without the Navigation API
Nothing is intercepted and every link is a full page load -
SSR or the CSR shell renders it, the app keeps working.
The Navigation API is in every major engine since early 2026.
:::

### Navigating from code

Svelte and MDX export `navigate` from `_/use`, taking the same tuple as `Link`:

```ts
import { navigate } from "_/use";

await navigate(["users/[id]", 123], { query: { tab: "posts" } });
await navigate(["login"], { replace: true });
```

It resolves once the destination is rendered.
Unlike the hooks, it can be called anywhere - an event handler, an effect, after an await.
React, SolidJS and Vue use their router's own: `useNavigate()` or `router.push()`.
