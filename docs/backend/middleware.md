---
title: Middleware
description: Understand middleware chains and Hono/H3/Koa onion model execution pattern.
    Global middleware in api/use.ts that runs for every route in a source folder.
    Configure middleware to run only for specific HTTP methods.
    Override global middleware using slot system.
head:
  - - meta
    - name: keywords
      content: hono middleware, h3 middleware, koa middleware, use function, middleware chain,
        onion model, middleware composition, middleware slots, global middleware, api/use.ts,
        app.use equivalent, folder-wide middleware, env.d.ts context types.
---

Beyond the standard HTTP method handlers, you often need to run custom middleware -
code that executes before your main handler to perform tasks like authentication,
logging, or data transformation.

## Basic Usage

KosmoJS provides the `use` function for applying middleware.
The same API applies identically to all frameworks, only the middleware internals slightly differs by framework:

```ts [api/example/index.ts]
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    // runs for both GET and POST
    return next();
  }),

  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
]);
```

Middleware must call `next()` to pass control to the next layer.
Skipping `next()` short-circuits the chain - useful for early rejections.

## Execution Order (Onion Model)

Middleware runs in definition order going in, then unwinds in reverse after the handler.

Consider this example:

```ts [api/example/index.ts]
export default defineRoute<"example">(({ POST, use }) => [
  use(async (ctx, next) => {
    console.log("First middleware");
    await next();
    console.log("First middleware after next");
  }),

  use(async (ctx, next) => {
    console.log("Second middleware");
    await next();
    console.log("Second middleware after next");
  }),

  POST(async (ctx) => {
    console.log("POST handler");
    // ...
  }),
]);
```

When a POST request arrives, the execution order is like:

```
First middleware
Second middleware
POST handler
Second middleware after next
First middleware after next
```

Global middleware from `api/use.ts` runs first, then route-level `use` calls, then the handler.
[More on global middleware&nbsp;›](#global-middleware-api-use-ts)

> **Positioning note:** All `use` calls run before method handlers regardless of where they appear
in the array. Defining `use` after a handler doesn't change this:

```ts
export default defineRoute<"example">(({ use, GET, POST }) => [
  use(firstMiddleware),
  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
  use(secondMiddleware), // still runs BEFORE handlers [!code hl]
]);
```

## Global Middleware (`api/use.ts`)

Every source folder is seeded with an `api/use.ts`.
Whatever it default-exports runs for **every route in that folder** - no imports, no registration, nothing to wire:

```ts [api/use.ts]
import { use } from "_/api";

export default [
  use(async function requestId(ctx, next) {
    ctx.set("requestId", crypto.randomUUID());
    return next();
  }),
];
```

It is an ordinary source file, created once with the folder and never regenerated or overwritten -
edit it freely. Unlike route files it cannot be seeded through [custom templates](/backend/custom-templates#what-it-overrides).

This is the place for concerns that are genuinely app-wide:
a request id, CORS, a logger, rate limiting, an auth check that every endpoint needs.

Anything narrower belongs in a [cascading use.ts](/backend/cascading-middleware) for a subtree, or in the route's own `use`.

### Global vs. cascading

Both files export an array of `use(...)` definitions, and both are picked up automatically.
They differ in reach and in how they type the context:

| | `api/use.ts` (global) | `api/<folder>/use.ts` (cascading) |
|---|---|---|
| Applies to | every route | folder's subtree only |
| Position | before all cascading and route middleware | parent before child, then the route's own middleware |
| Context types | [`api/env.d.ts`](/backend/type-safety#global-context-types-api-env-d-ts) module augmentation | its exported `UseT`, which cascades downward |
| Exports&nbsp;a&nbsp;`UseT`? | **no** - see below | yes, always (even when empty) |

::: tip `api/use.ts` does not export `UseT`
A `UseT` exported from the **global** file is **ignored**.
Global middleware is typed through `api/env.d.ts` instead -
`DefaultVariables` / `DefaultBindings` (Hono), `DefaultContext` (H3), `DefaultState` / `DefaultContext` (Koa).
`UseT` is a cascading-middleware mechanism: it exists so types travel down a subtree alongside the middleware that sets them,
which is exactly what a folder-wide file doesn't need.
[Type-safe&nbsp;context&nbsp;›](/backend/cascading-middleware#type-safe-context-extension)
:::

### It runs per route, not per request

Global middleware is composed into **each route's** chain.
A request that matches no route never reaches it - there is no route whose chain to run.

So `api/use.ts` is not an Express-style `app.use()`:
it can't answer unmatched URLs, and it can't see requests outside this folder's `apiBase`.

For work that must happen on every request regardless of routing,
reach for the framework's own app instance in [api/app.ts](/essentials/project-structure#inside-a-source-folder),
where `appFactory`'s callback hands you `{ app }` and any native Hono/H3/Koa middleware applies.

### Restricting and overriding it

Global middleware takes the same options as any other `use` call, so [on](#method-specific-middleware) works here too:

```ts [api/use.ts]
export default [
  use(auditWrite, { on: ["POST", "PUT", "PATCH", "DELETE"] }),
];
```

To let individual routes replace a global default, give it a [slot](#slot-composition).
A route declaring the same slot **substitutes** that middleware -
and the replacement runs **in the global one's position** in the chain, so surrounding order is preserved:

```ts [api/use.ts]
export default [
  use(defaultLogger, { slot: "logger" }),   // replaceable
  use(requestId),                           // always runs
];
```

A global middleware **without** a slot cannot be overridden or skipped by any route -
which is what you want for a security check, and worth knowing before you reach for a slot out of habit.

## Method-Specific Middleware

Use the `on` option to restrict middleware to specific HTTP methods:

```ts [api/example/index.ts]
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    ctx.state.user = await verifyToken(ctx.headers.authorization);
    return next();
  }, {
    on: ["POST"], // [!code hl]
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.state.user is available
  }),
]);
```

## Slot Composition

Slots are named positions in the middleware chain. Middleware with the same slot name
replaces earlier middleware at that position - useful for overriding global defaults per-route.

A global error handler defined in `api/use.ts`:

```ts [api/use.ts]
export default [
  use(
    async (ctx, next) => { /* global logger */ },
    { slot: "logger" },
  ),
];
```

Override it for a specific route:

```ts [api/upload/index.ts]
export default defineRoute<"upload">(({ POST, use }) => [
  use(
    async (ctx, next) => {
      // custom logger for this route only
    },
    { slot: "logger" },
  ),
  POST(async (ctx) => { /* ... */ }),
]);
```

> **Important:** When overriding via slot, explicitly set `on` if needed -
it doesn't inherit from the middleware being replaced.

Custom slot names, like `logger`, should be added to `api/env.d.ts`:

```ts [api/env.d.ts]
export declare module "@kosmojs/core/api" {
  interface UseSlots {
    logger: string; // [!code hl]
  }
}
```

Then use it anywhere:

```ts
use(async (ctx, next) => { /* ... */ }, { slot: "logger" })
```
