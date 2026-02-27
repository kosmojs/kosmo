---
title: Type Safety - State and Context
description: Add route-specific TypeScript types and context properties
    in KosmoJS using defineRoute generic type arguments for endpoints with unique middleware requirements.
head:
  - - meta
    - name: keywords
      content: koa state typing, route-specific types,
        context properties, type arguments, middleware types, DefaultContext
---

Beyond parameter types, you might need to provide additional type information
about state or context properties that aren't covered by the global declarations in `api/env.d.ts`.

Perhaps a specific route uses middleware that adds properties that aren't used elsewhere,
making them inappropriate for the global interface.

The `defineRoute` function is a generic that accepts three type arguments, all optional.

🔹 The first is a params refinement tuple we just covered.<br/>
🔹 The second lets you type route-specific state/locals.<br/>
🔹 The third lets you declare additional properties on the request/context object.

```ts [api/users/:id/index.ts]
import { defineRoute } from "_/front/api/users/:id";
import type { User } from "@/front/types";

export default defineRoute<
  [number], // params refinements
  { permissions: Array<"read" | "write"> }, // route-specific state
  { authorizedUser: User }, // route-specific context
>(({ GET }) => [
  GET(async (ctx) => {
    // ctx.validated.params.id is number
    // ctx.state.permissions is Array<"read" | "write">
    // ctx.authorizedUser is User
  }),
]);
```

:::

This approach is useful for route-specific types, but remember
that if you find yourself declaring the same properties in many routes,
it's better to add them to the global declarations in `api/env.d.ts` instead.
([Details ➜ ](/api-server/core-configuration))

Use route-specific type arguments for properties that truly are unique to specific endpoints.
