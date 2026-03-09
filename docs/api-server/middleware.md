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
    // This runs for both GET and POST requests
    return next();
  }),

  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
]);
```

Both `Koa` and `Hono` middleware receive the `ctx` (context) object and a `next` function.
They must call `next()` to allow the request to proceed to subsequent middleware or the final handler.

If middleware doesn't call `next()`, the request stops there -
useful for cases where you want to reject a request early based on some condition.

## 🔄 Middleware Chains

Understanding how middleware executes helps you structure your endpoints effectively.
Middleware runs in the order you define it in the array returned from your factory function.

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

When a POST request arrives, you'll see this output:

```
First middleware
Second middleware
POST handler
Second middleware after next
First middleware after next
```

Middleware executes in order until reaching your method handler,
then unwinds back through the middleware in reverse order.

This "onion" model allows middleware to do work both before and after your handler runs -
useful for tasks like timing requests, catching errors, or modifying responses.

Global middleware from `api/use.ts` executes first,
followed by route-specific middleware defined with `use`, and finally your method handler.

This predictable order makes it easier to reason about what happens during a request.

## 📍 Middleware Positioning

The rule of thumb: All middleware always runs before method handlers,
regardless of where you place the `use` calls in your array.

It doesn't matter where `use` is placed, before handlers or after - middleware always runs before handlers.

```ts
export default defineRoute(({ use, GET, POST }) => [
  use(firstMiddleware),

  GET(async (req, res) => { // or (ctx) for Koa
    // ... handler logic
  }),

  POST(async (req, res) => { // or (ctx) for Koa
    // ... handler logic
  }),

  use(secondMiddleware), // Still runs BEFORE handlers! [!code hl]
]);
```

Even though `secondMiddleware` is defined after the GET and POST handlers,
it executes before them. The execution order is:

1. `firstMiddleware`
2. `secondMiddleware`
3. GET or POST handler (whichever matches the request)

`KosmoJS` collects all middleware first, then routes to the appropriate method handler.
The position of `use` calls relative to method handlers doesn't change execution order.

## 🎯 Method-Specific Middleware

Often you need middleware to run only for specific HTTP methods.

For example, authentication might be required for POST, PUT, and DELETE requests
but not for GET requests.

`KosmoJS` supports this through the `on` option:

```ts [api/example/index.ts]
export default defineRoute<"example">(({ GET, POST, PUT, DELETE, use }) => [
  use(async (ctx, next) => {
    // ...
    ctx.state.user = await verifyToken(token);
    return next();
  }, {
    on: ["POST", "PUT", "DELETE"], // run only on these methods // [!code hl]
  }),

  GET(async (ctx) => {
    // Public access - no authentication required
  }),

  POST(async (ctx) => {
    // ctx.state.user is available here
  }),

  PUT(async (ctx) => {
    // ctx.state.user is available here
  }),

  DELETE(async (ctx) => {
    // ctx.state.user is available here
  }),
]);
```

The `on` option accepts an array of HTTP method names.
The middleware only executes when the incoming request matches one of those methods.

This targeted approach keeps your middleware efficient and your intentions clear.

## 🎛 Slot Composition

Slot system gives you fine-grained control over middleware composition and override behavior.

Using slot composition, you can precisely control which middleware runs and when,
including selective overrides.

This becomes important when working with global middleware that applies to all routes
but needs customization for specific endpoints.

`KosmoJS` applies certain middleware globally through a core configuration file
located at `api/use.ts`.

This file defines middleware that runs for every API endpoint by default.
However, individual routes can override this default behavior using slots.

A slot is essentially a named position in the middleware chain.
When you assign a slot name to middleware, any subsequent middleware
with the same slot name replaces the earlier one.

This replacement mechanism gives you fine-grained control over which middleware runs where.

Let's look at a concrete example from `KosmoJS`'s core configuration:

```ts [api/use.ts]
import { use } from "_/front/api";

export default [
  use(
    async function useErrorHandler(ctx, next) {
      // default error handler
    },
    { slot: "errorHandler" },
  ),
];
```

Now suppose you have an endpoint that needs custom error handler.
You can override the `errorHandler` middleware by using the same slot name:

```ts [api/upload/index.ts]
import { defineRoute } from "_/front/api";

export default defineRoute<"upload">(({ POST, use }) => [
  use(
    async (ctx, next) => {
      // custom error handler
    },
    { slot: "errorHandler" },
  ),

  POST(async (ctx) => {
    // ...
  }),
]);
```

By using `slot: "errorHandler"`, this route-specific middleware replaces
the default error handler for this endpoint only.

**Important:** When you override middleware using a slot,
you must explicitly specify which methods it should run on with the `on` option.
The `on` configuration doesn't inherit from the middleware you're replacing.

If you omit the `on` option, your slotted middleware will run for all HTTP methods,
which might not be what you want and could cause errors for methods that don't expect that processing.

**Worth noting:** Slot names aren't limited to built-in slots.
You can define custom slots by extending the `UseSlots` interface
in your `api/env.d.ts` file:

```ts [api/env.d.ts]
export declare module "@kosmojs/api" {
  interface UseSlots {
    logger: string; // [!code hl]
  }
}
```

Now you can use the `logger` slot with your middleware:

```ts
export default defineRoute<"example">(({ POST, use }) => [
  use(
    async (ctx, next) => {
      // Custom logger implementation
    },
    { slot: "logger" }, // [!code hl]
  ),
  POST(async (ctx) => {
    // ...
  }),
]);
```
