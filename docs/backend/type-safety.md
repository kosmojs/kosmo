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

## Typing Params

Parameters are strings by default. Refine them via the second type argument to `defineRoute`
by providing a tuple where each position maps to the corresponding parameter in the path:

```ts [api/users/[id]/{action}/index.ts]
type UserAction = "retrieve" | "update" | "delete";

export default defineRoute<"users/[id]/{action}", [
  number,      // id
  UserAction,  // action
]>(({ GET }) => [
  GET(async (ctx) => {
    const {
      id,     // number
      action, // UserAction | undefined
    } = ctx.validated.params;
  }),
]);
```

Positions are optional - but to refine the second param you must also provide the first.

### ❗ Keep the Tuple Brackets Literal

The refinement tuple's `[]` must be written inline. Type aliases used *inside* it are fine;
extracting the whole tuple to a named type is not:

```ts
// ✅ works - brackets literal, contents aliased
defineRoute<"[id]/[action]", [UserID, UserAction]>

// ❌ won't work - the brackets themselves are behind an alias
type Params = [UserID, UserAction];
defineRoute<"[id]/[action]", Params>
```

The position is read structurally from the source, mapping each slot to a route parameter,
so an alias leaves nothing to destructure.
It fails silently: the schema does not build and **every** request is rejected.

The same rule covers the `response` tuple and the `VRefine` constraint object.
[The bracket rule&nbsp;›](/validation/refine#keep-the-wrapping-brackets-literal)

Refinements also drive runtime validation - invalid params are rejected before your handler runs.
[Details&nbsp;›](/validation/params)

## Typing Payload and Response

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

    // return ctx.json(user);   // Hono
    // return user              // H3
    // ctx.body = user;         // Koa
  }),
]);
```

Both payload and response are validated at runtime, not just at compile time.
[Details&nbsp;›](/validation/payload)

## Typing State & Context

`defineRoute` accepts four type arguments:

:::tabs key:backend variant:code
== Hono
```ts
defineRoute<
  "route-name",
  ParamsTuple,      // param refinements
  Variables,        // route-specific locals
  Bindings,         // route-specific bindings
>
```

== H3
```ts
defineRoute<
  "route-name",
  ParamsTuple,      // param refinements
  Context,          // route-specific context properties
>
```

== Koa
```ts
defineRoute<
  "route-name",
  ParamsTuple,      // param refinements
  State,            // route-specific state/locals
  Context,          // route-specific context properties
>
```
:::

Use the third and fourth arguments for types that are unique to a specific route:

:::tabs key:backend variant:code
== Hono
```ts
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

== H3
```ts
export default defineRoute<
  "users/[id]",
  [number],
  { permissions: Array<"read" | "write"> },  // event.context.permissions
>(({ GET }) => [
  GET(async (event) => {
    const { id } = event.validated.params;
    const { permissions } = event.context;
  }),
]);
```

== Koa
```ts
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
:::

If you find yourself declaring the same properties across many routes,
move them to the global declarations in `api/env.d.ts` instead.

## Global Context Types - `api/env.d.ts`

`api/env.d.ts` extends the default context and state interfaces globally,
so every route handler picks them up automatically:

:::tabs key:backend variant:code
== Hono
```ts
export declare module "_/api" {
  interface DefaultVariables {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultBindings {
    DB: D1Database;
  }
}
```

== H3
```ts
export declare module "_/api" {
  interface DefaultContext {
    permissions: Array<"read" | "write" | "admin">;
  }
}
```

== Koa
```ts
export declare module "_/api" {
  interface DefaultState {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultContext {
    authorizedUser: User;
  }
}
```
:::

> **Important:** declaring types in `env.d.ts` doesn't set the values -
you still need the middleware that actually populates them.

The right place to set global properties is `api/use.ts` file.
It runs for every endpoint, so properties becomes available for all routes:

:::tabs key:backend variant:code
== Hono
```ts
import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    ctx.set("permissions", await getPermissions(ctx)); // [!code hl]
    return next();
  }),
];
```

== H3
```ts
import { use } from "_/api";

export default [
  use(async (event, next) => {
    event.context.permissions = await getPermissions(ctx);  // [!code hl]
    return next();
  }),
];
```

== Koa
```ts
import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    ctx.state.permissions = await getPermissions(ctx);  // [!code hl]
    return next();
  }),
];
```
:::
