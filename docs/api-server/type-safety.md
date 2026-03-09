---
title: Type Safety
description: Refine params/payload/response types in KosmoJS with compile-time TypeScript checking
    and automatic runtime validation using type arguments
head:
  - - meta
    - name: keywords
      content: typed params, typed json payload, typed response
---

With `KosmoJS`, you get type safety across your entire route: path parameters,
request payloads (JSON/form/query), and responses.

## 🔗 Typing Params

With directory-based routing, route name serve as the source of truth for path parameters.
When you have a route like `users/[id]/index.ts`, `KosmoJS` knows there's an `id` param.

However, by default, route parameters are typed as strings since that's what URLs contain.

Often you need more specific types. Maybe your user ID is actually a number,
or perhaps you have an action parameter that should be constrained to a specific set of valid values.

Refine your parameter types by passing a tuple to `defineRoute`'s second type argument.
The <ins>tuple positions correspond directly to the order of parameters</ins> in your route name.

For a route at `users/[id]/index.ts` where the ID should be a number:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/front/api"

export default defineRoute<"users/[id]", [
  number // validate id as number // [!code ++]
]>(({ GET }) => [
  GET(async (ctx) => {
    // id is typed and casted/validated to a number // [!code hl]
    const { id } = ctx.validated.params
  }),
]);
```

For a route with multiple parameters like `users/[id]/{action}/index.ts`:

```ts [api/users/[id]/{action}/index.ts]
import { defineRoute } from "_/front/api"

type UserAction = "retrieve" | "update" | "delete";

export default defineRoute<"users/[id]/{action}", [
  number, // [!code ++:2]
  UserAction,
]>(({ GET, POST }) => [
  GET(async (ctx) => {
    // id is a number // [!code hl:2]
    // action is one of "retrieve" | "update" | "delete" | undefined
    const { id, action } = ctx.validated.params;
  }),
]);
```

The position of the type argument corresponds to the position of the parameter in your route path.
The first type refines the first parameter, the second type refines the second parameter, and so on.

All positions are optional, with a caveat - if you need to refine second param,
you'll have to also provide a type for the first one.

### ❗ Type Literal Requirement

The refinement tuple must be declared **inline as a type literal**.
While you can use type aliases for individual parameter types, you cannot reference a pre-defined tuple type.

**✅ This works:**

```ts
// Individual type aliases are fine
type UserID = number;
type UserAction = "retrieve" | "update" | "delete";

defineRoute<"[id]/[action]", [
  UserID,
  UserAction,
]>(({ GET }) => [
  GET(async (ctx) => {
    // ...
  }),
]);
```

**❌ This won't work:**

```ts
// Pre-defined tuple types are not supported
type Params = [number, UserAction];
defineRoute<"[id]/[action]", Params>(/* ... */) // Error: type references won't work
```

**💡 Why this requirement?**
`KosmoJS` needs to analyze the type structure at generation time to create corresponding validation schemas.
Type references don't preserve the necessary structural information for this analysis.

Think of it as providing the "blueprint" directly rather than a "reference to the blueprint"! 🏗️

### ✨ Beyond compile-time safety

These type refinements aren't just for `TypeScript`'s benefit.
`KosmoJS` also validates parameters at runtime according to your specifications!
([Details ➜ ](/validation/params)).

If a request comes in with an ID that can't be parsed as a number,
or an action that isn't one of your allowed values, `KosmoJS` rejects the request before your handler runs.

This validation happens automatically - you don't need to write additional validation code!

## 🔋 Typing Payload/Response

Beyond route parameters, you can also type the request payload and response body for each HTTP method handler.

This ensures that your handlers receive the data they expect and return properly structured responses.

Method handlers (GET, POST, PUT, etc.) are generic functions that accept optional type arguments.

Use first type argument to define expected payload/response schemas.

```ts [api/example/index.ts]
import { defineRoute } from "_/front/api";
import type { User } from "@/front/types";

export default defineRoute<"example">(({ POST }) => [
  POST<{
    json: { name: string; email: string; status?: string },
    response: [200, "json", User],
  }>(async (ctx) => {
    // ctx.validated.json is typed as { name: string; email: string; status?: string }
    const { name, email, status } = ctx.validated.json;

    const user = await createUser({ name, email, status });

    // response body must be set to a User object
    ctx.body = user; // for Koa
    ctx.json(user); // for Hono
  }),
]);
```

When you provide these types, `TypeScript` enforces them throughout your handler.
You get autocomplete on `ctx.validated` properties,
and `TypeScript` verifies that you assign correct response body.

Like parameter refinement, these types aren't just compile-time checks.
`KosmoJS` validates the incoming payload against your specified type at runtime
and validates the outgoing response as well.
([Details ➜ ](/validation/payload)).

If validation fails, `KosmoJS` handles the error appropriately without your handler code running.

## 📋 Typing State/Context

You might also need to provide type information about state or context properties
that aren't covered by the global declarations in [api/env.d.ts](/api-server/core-configuration).

Perhaps a specific route uses middleware that adds properties that aren't used elsewhere,
making them inappropriate for the global interface.

The `defineRoute` function is a generic that accepts four type arguments:<br />
🔹 The first is the route name and is the only required argument<br />
🔹 The second is a params refinement tuple<br/>
🔹 The third lets you type route-specific state/locals<br/>
🔹 The fourth lets you declare additional properties on the request/context object

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/front/api";
import type { User } from "@/front/types";

export default defineRoute<
  "users/[id]", // route name
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

This is a Koa example. For Hono, the approach is identical -
add custom variables to third argument and/or custom bindings to forth,
and your properties will be available via `ctx.set()`, `ctx.get()`, and `ctx.var`.

**Important:** Don't forget to add the middleware that actually sets these properties.
Without the middleware, the properties you defined won't be available in the handlers.

This approach is useful for route-specific types, but remember
that if you find yourself declaring the same properties in many routes,
it's better to add them to the global declarations in `api/env.d.ts` instead.
([Details ➜ ](/api-server/core-configuration))

Use route-specific type arguments for properties that truly are unique to specific endpoints.
