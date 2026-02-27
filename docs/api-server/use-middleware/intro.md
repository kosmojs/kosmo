---
title: Use Middleware
description: Apply custom middleware in KosmoJS with the use function for authentication,
    logging, and data transformation. Understand middleware chains and Koa/Hono onion model execution pattern.
head:
  - - meta
    - name: keywords
      content: koa middleware, hono middleware, use function, middleware chain,
        onion model, middleware composition, request logging
---

Beyond the standard HTTP method handlers, you often need to run custom middleware -
code that executes before your main handler to perform tasks like authentication,
logging, or data transformation.

## 🔧 Basic Usage

`KosmoJS` provides the `use` function for this purpose,
which works with both Express and Koa middleware patterns.

The most basic use of `use` applies middleware to all HTTP methods on that endpoint:

```ts [api/example/index.ts]
export default defineRoute(({ GET, POST, use }) => [
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
export default defineRoute(({ GET, POST, use }) => [
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
