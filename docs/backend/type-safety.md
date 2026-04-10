---
title: Type Safety
description: Refine params/payload/response types in KosmoJS with compile-time TypeScript checking
    and automatic runtime validation using type arguments
head:
  - - meta
    - name: keywords
      content: typed params, typed json payload, typed response, global middleware,
        DefaultContext, DefaultState, DefaultVariables, env.d.ts
---

Type safety in `KosmoJS` covers the full request-response cycle:
path parameters, payloads, responses, and context/state properties -
all driving both compile-time checking and runtime validation from the same type definitions.

## 🔗 Typing Params

Parameters are strings by default. Refine them via the second type argument to `defineRoute`
by providing a tuple where each position maps to the corresponding parameter in the path:

```ts [api/users/[id]/{action}/index.ts]
type UserAction = "retrieve" | "update" | "delete";

export default defineRoute<"users/[id]/{action}", [
  number,      // id
  UserAction,  // action
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id, action } = ctx.validated.params;
    // id: number, action: UserAction | undefined
  }),
]);
```

Positions are optional - but to refine the second param you must also provide the first.

### ❗ Inline Tuple Requirement

The refinement tuple must be declared inline. Individual type aliases are fine,
but a pre-defined tuple type won't work:

```ts
// ✅ works
defineRoute<"[id]/[action]", [UserID, UserAction]>

// ❌ won't work - tuple reference loses structural info needed for schema generation
type Params = [UserID, UserAction];
defineRoute<"[id]/[action]", Params>
```

Refinements also generate runtime validation - invalid params are rejected before your handler runs.
([Details ➜ ](/validation/params))

## 🔋 Typing Payload & Response

The first type argument to each method handler defines payload and response schemas:

```ts [api/example/index.ts]
import type { User } from "~/types";

export default defineRoute<"example">(({ POST }) => [
  POST<{
    json: { name: string; email: string; status?: string },
    response: [200, "json", User],
  }>(async (ctx) => {
    const { name, email, status } = ctx.validated.json;
    const user = await createUser({ name, email, status });

    ctx.body = user;     // Koa
    // ctx.json(user);   // Hono
  }),
]);
```

Both payload and response are validated at runtime, not just at compile time.
([Details ➜ ](/validation/payload))

## 📋 Typing State & Context

`defineRoute` accepts four type arguments:

::: code-group
```ts [Koa]
defineRoute<
  RouteName,        // required
  ParamsTuple,      // param refinements
  State,            // route-specific state/locals
  Context,          // route-specific context properties
>
```

```ts [Hono]
defineRoute<
  RouteName,        // required
  ParamsTuple,      // param refinements
  Variables,        // route-specific locals
  Bindings,         // route-specific bindings
>
```
:::

Use the third and fourth arguments for types that are unique to a specific route:

::: code-group
```ts [Koa]
export default defineRoute<
  "users/[id]",
  [number],
  { permissions: Array<"read" | "write"> },  // ctx.state.permissions
  { authorizedUser: User },                  // ctx.authorizedUser
>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const { permissions } = ctx.state;
    const { authorizedUser } = ctx;
  }),
]);
```

```ts [Hono]
export default defineRoute<
  "users/[id]",
  [number],
  { permissions: Array<"read" | "write"> },  // ctx.get("permissions")
  { DB: D1Database },                        // Cloudflare binding
>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const permissions = ctx.get("permissions");
    const db = ctx.env.DB;
  }),
]);
```
:::

If you find yourself declaring the same properties across many routes,
move them to the global declarations in `api/env.d.ts` instead.

## ⚙️ Global Context Types - `api/env.d.ts`

`api/env.d.ts` extends the default context and state interfaces globally,
so every route handler picks them up automatically:

::: code-group
```ts [Koa: api/env.d.ts]
export declare module "_/api" {
  interface DefaultState {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultContext {
    authorizedUser: User;
  }
}
```

```ts [Hono: api/env.d.ts]
export declare module "_/api" {
  interface DefaultVariables {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultBindings {
    DB: D1Database;
  }
}
```
:::

`api/use.ts` defines global middleware that runs for every endpoint -
the right place to set these properties so they're always available:

```ts [api/use.ts]
import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    ctx.state.permissions = await getPermissions(ctx);  // Koa
    // ctx.set("permissions", await getPermissions(ctx)); // Hono
    return next();
  }),
];
```

**Important:** declaring types in `env.d.ts` doesn't set the values -
you still need the middleware that actually populates them.
