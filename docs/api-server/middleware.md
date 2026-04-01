---
title: Middleware
description: Understand middleware chains and Koa/Hono onion model execution pattern.
    Configure middleware to run only for specific HTTP methods.
    Override global middleware using slot system.
head:
  - - meta
    - name: keywords
      content: koa middleware, hono middleware, use function, middleware chain,
        onion model, middleware composition, middleware slots.
---

Beyond the standard HTTP method handlers, you often need to run custom middleware -
code that executes before your main handler to perform tasks like authentication,
logging, or data transformation.

## 🔧 Basic Usage

KosmoJS provides the `use` function for applying middleware,
with the same API for both `Koa` and `Hono` routes.
By default, middleware applied to all HTTP methods:

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

## 🔄 Execution Order (Onion Model)

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
    ctx.body = { success: true }; // for Koa
    ctx.json({ success: true }); // for Hono
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

**Positioning note:** All `use` calls run before method handlers regardless of where they appear
in the array. Defining `use` after a handler doesn't change this:

```ts
export default defineRoute(({ use, GET, POST }) => [
  use(firstMiddleware),
  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
  use(secondMiddleware), // still runs BEFORE handlers [!code hl]
]);
```

## 🎯 Method-Specific Middleware

Use the `on` option to restrict middleware to specific HTTP methods:

```ts [api/example/index.ts]
export default defineRoute<"example">(({ GET, POST, PUT, DELETE, use }) => [
  use(async (ctx, next) => {
    ctx.state.user = await verifyToken(ctx.headers.authorization);
    return next();
  }, {
    on: ["POST", "PUT", "DELETE"], // [!code hl]
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.state.user is available
  }),
]);
```

## 🎛️ Slot Composition

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

**Important:** When overriding via slot, explicitly set `on` if needed -
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
