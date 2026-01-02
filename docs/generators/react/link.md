---
title: React - Type-Safe Navigation
description: Generated Link component wrapping React Router with compile-time
  route validation. Autocomplete navigation targets, parameter enforcement,
  and query string handling for error-free routing.
head:
  - - meta
    - name: keywords
      content: react navigation, type-safe links, react router wrapper, route
        autocomplete, parameter validation, query strings react, typed
        navigation, react routing safety
---

The generator produces a `Link` component wrapping React Router's native
`Link` with compile-time route validation. This wrapper understands your
complete route structure and parameters, delivering autocomplete and type
checking throughout navigation code.

Access this component at `components/Link.tsx` within your source folder:

```tsx [components/Link.tsx]
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

Implement type-safe navigation throughout your components:

```tsx [components/menu.tsx]
import Link from "@/front/components/Link";

export default function Menu() {
  return (
    <nav>
      <Link to={["index"]}>
        <IconHome />
        Home
      </Link>

      <Link to={["users/[id]", 123]}>
        User Profile
      </Link>

      <Link to={["posts/[slug]", "hello-world"]} query={{ ref: "sidebar" }}>
        Blog Post
      </Link>
    </nav>
  );
}
```

The `to` prop accepts `LinkProps` type - a union generated from your route
structure:

```ts
export type LinkProps =
  | ["index"]
  | ["users/[id]", id: string | number]
  | ["posts/[slug]", slug: string]
  // ... other routes
```

This typing mechanism provides several development advantages.

Typing the first array element triggers `TypeScript`'s IntelliSense with valid
route suggestions. Selecting parameterized routes requires providing those
parameters as subsequent array elements - the type system enforces this.

Renaming route directories generates `TypeScript` errors at every Link
referencing the old identifier, creating an automatic refactoring checklist
across your codebase.

The optional `query` prop accepts plain objects, with the Link component
handling URL encoding and query string serialization internally.

Omitting the `to` prop targets the current location, enabling query parameter
manipulation without navigation:

```tsx
// Add a query parameter to current route
<Link query={{ filter: "active" }}>
  Filter Active Items
</Link>
```

The Link component extends `React Router`'s `Link` with type safety while
accepting all standard props. The `to` prop replacement provides autocomplete
and validation while preserving access to props like `replace`, `state`, and
other router-specific attributes.
