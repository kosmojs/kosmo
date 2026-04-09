---
title: Type-Safe Navigation
description: Generated Link component wrapping each framework's native router
  with compile-time route validation. Autocomplete navigation targets, parameter
  enforcement, and query string handling for React, SolidJS, Vue and MDX.
head:
  - - meta
    - name: keywords
      content: react navigation, solidjs link, vue router link, mdx link component,
        type-safe links, route autocomplete, parameter validation, typed navigation.
---

The generator produces a `Link` component that wraps each framework's native
router link with compile-time route validation. It knows your complete route
structure and parameters, delivering autocomplete and type checking throughout
navigation code.

The component is available at `components/Link.tsx` (or `Link.vue`) in your
source folder.

## 🔗 Usage

The API is consistent across all frameworks - a `to` prop accepting a
typed tuple, an optional `query` prop for search parameters, and standard
router props passed through:

::: code-group

```tsx [Menu.tsx]
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

```vue [Menu.vue]
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
:::

Omitting `to` targets the current location - useful for adding or updating
query parameters without triggering navigation:

::: code-group

```tsx [Menu.tsx]
<Link query={{ filter: "active" }}>Filter Active Items</Link>
```

```vue [Menu.vue]
<Link :query="{ filter: 'active' }">Filter Active Items</Link>
```

:::

## 🏷️ LinkProps Type

The `to` prop is typed as `LinkProps` - a discriminated union generated from
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
