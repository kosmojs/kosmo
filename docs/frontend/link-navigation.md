---
title: Type-Safe Navigation
description: Generated Link component wrapping each framework's native router
  with compile-time route validation. Autocomplete navigation targets, parameter
  enforcement, and query string handling for React, SolidJS, and Vue.
head:
  - - meta
    - name: keywords
      content: react navigation, solidjs link, vue router link, type-safe links,
        route autocomplete, parameter validation, query strings, typed navigation,
        LinkProps, kosmojs navigation
---

The generator produces a `Link` component that wraps each framework's native
router link with compile-time route validation. It knows your complete route
structure and parameters, delivering autocomplete and type checking throughout
navigation code.

The component is available at `components/Link.tsx` (or `Link.vue`) in your
source folder.

## 🔗 Usage

The API is consistent across all three frameworks - a `to` prop accepting a
typed tuple, an optional `query` prop for search parameters, and standard
router props passed through:

::: code-group

```tsx [Menu.tsx]
import Link from "@/front/components/Link";

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

```vue [Vue · Menu.vue]
<script setup lang="ts">
import Link from "@/front/components/Link.vue";
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

```vue [Vue · Menu.vue]
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

## 🧱 Component Implementation

::: code-group

```tsx [React · components/Link.tsx]
import {
  type LinkProps as RouterLinkProps,
  Link as RouterLink,
  useLocation,
} from "react-router";
import type { ReactNode } from "react";
import { stringify } from "@kosmojs/fetch";

import { type LinkProps, pageMap } from "_/front/router";
import { baseurl } from "@/front/config";

export default function Link(
  props: Omit<RouterLinkProps, "to"> & {
    to?: LinkProps;
    query?: Record<string | number, unknown>;
    children: ReactNode;
  },
) {
  const { to, query, children, ...restProps } = props;
  const location = useLocation();

  const href = () => {
    if (to) {
      const [key, ...params] = to;
      return pageMap[key]?.base(params as never, query);
    }
    const path = location.pathname.replace(
      new RegExp(`^${baseurl.replace(/\/+$/, "")}/`),
      "/",
    );
    return query ? [path, stringify(query)].join("?") : path;
  };

  return (
    <RouterLink {...restProps} to={href()}>
      {children}
    </RouterLink>
  );
}
```

```tsx [SolidJS · components/Link.tsx]
import { A, type AnchorProps, useLocation } from "@solidjs/router";
import { type JSXElement, splitProps } from "solid-js";
import { stringify } from "@kosmojs/fetch";

import { unwrap } from "_/front/unwrap";
import { type LinkProps, pageMap } from "_/front/router";
import { baseurl } from "@/front/config";

export default function Link(
  props: Omit<AnchorProps, "href"> & {
    to?: LinkProps;
    query?: Record<string | number, unknown>;
    children: JSXElement;
  },
) {
  const [knownProps, restProps] = splitProps(props, ["to", "query", "children"]);
  const location = useLocation();

  const href = () => {
    if (knownProps.to) {
      const [key, ...params] = knownProps.to;
      return pageMap[key]?.base(params as never, knownProps.query);
    }
    const path = location.pathname.replace(
      new RegExp(`^${baseurl.replace(/\/+$/, "")}/`),
      "/",
    );
    return knownProps.query
      ? [path, stringify(unwrap(knownProps.query))].join("?")
      : path;
  };

  return <A {...{ ...restProps, href: href() }}>{knownProps.children}</A>;
}
```

```vue [Vue · components/Link.vue]
<script setup lang="ts" generic="T extends LinkProps">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { stringify } from "@kosmojs/fetch";

import { unwrap } from "_/front/unwrap";
import { type LinkProps, pageMap } from "_/front/router";
import { baseurl } from "@/front/config";

interface Props {
  to?: T;
  query?: Record<string | number, unknown>;
  replace?: boolean;
  activeClass?: string;
  exactActiveClass?: string;
}

const props = defineProps<Props>();
const route = useRoute();

const href = computed(() => {
  if (props.to) {
    const [key, ...params] = props.to;
    return pageMap[key]?.base(params as never, props.query);
  }
  const path = route.path.replace(
    new RegExp(`^${baseurl.replace(/\/+$/, "")}/`),
    "/",
  );
  return props.query ? [path, stringify(unwrap(props.query))].join("?") : path;
});
</script>

<template>
  <RouterLink
    :to="href"
    :replace="replace"
    :active-class="activeClass"
    :exact-active-class="exactActiveClass"
  >
    <slot />
  </RouterLink>
</template>
```

:::

A few implementation differences worth noting:

- **SolidJS** uses `splitProps` for reactive-safe prop destructuring, and passes `query` through `unwrap` to handle reactive stores transparently.
- **Vue** uses `unwrap` on `props.query` for the same reason - `Ref`-wrapped query objects are automatically unwrapped before serialization.
- **React** destructures props directly; no unwrapping needed since React state is always plain values.

Each component extends its framework's native router link - passing through
all standard props (`replace`, `state`, `activeClass`, etc.) alongside the
typed `to` and `query` additions.
