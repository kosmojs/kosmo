---
title: Use Middleware
description: Apply custom middleware in KosmoJS with the use function for authentication,
    logging, and data transformation. Understand middleware chains and Koa's onion model execution pattern.
head:
  - - meta
    - name: keywords
      content: koa middleware, use function, middleware chain, authentication middleware,
        onion model, middleware composition, request logging
---

Beyond the standard HTTP method handlers, you often need to run custom middleware -
code that executes before your main handler to perform tasks like authentication,
logging, or data transformation.

## 🔧 Basic Usage

`KosmoJS` provides the `use` function for this purpose,
which works similarly to Koa's standard middleware system but with additional capabilities.

The most basic use of `use` applies middleware to all HTTP methods on that endpoint:

```ts [api/example/index.ts]
export default defineRoute(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    // This runs for both GET and POST requests
    console.log(`Request to ${ctx.path}`);
    return next();
  }),

  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
]);
```

Middleware functions follow Koa's conventions.
They receive the context object and a `next` function, and they must call `next()`
to allow the request to proceed to subsequent middleware or the final handler.

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
    ctx.body = { success: true };
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

This "onion" model is a core `Koa` concept that `KosmoJS` preserves.
It allows middleware to do work both before and after your handler runs -
useful for tasks like timing requests, catching errors, or modifying responses.

Global middleware from `core/api/use.ts` executes first,
followed by route-specific middleware defined with `use`, and finally your method handler.

This predictable order makes it easier to reason about what happens during a request.

## 📍 Middleware Positioning

The rule of thumb: All middleware always runs before method handlers,
regardless of where you place the `use` calls in your array.

It doesn't matter where `use` is placed, before handlers or after - middleware always runs before handlers.


```ts
export default defineRoute(({ use, GET, POST }) => [
  use(firstMiddleware),

  GET(async (ctx) => {
    ctx.body = "GET response";
  }),

  POST(async (ctx) => {
    ctx.body = "POST response";
  }),

  use(secondMiddleware), // Still runs BEFORE handlers! [!code hl]
]);
```

Even though `secondMiddleware` is defined after the GET and POST handlers, it executes before them. The execution order is:

1. `firstMiddleware`
2. `secondMiddleware`
3. GET or POST handler (whichever matches the request)

`KosmoJS` collects all middleware first, then routes to the appropriate method handler.
The position of `use` calls relative to method handlers doesn't change execution order.

### Running Logic After Handlers

To run code *after* a handler executes, use the onion model with `await next()`:

```ts
use(async (ctx, next) => {
  console.log("Before handler");

  await next(); // Handler runs here

  console.log("After handler");
  // Add post-handler logic here
  ctx.set("X-Processing-Time", `${Date.now() - start}ms`);
});
```

The `await next()` call runs all subsequent middleware and the final handler.
When control returns to your middleware, the handler has already executed and set `ctx.body`,
allowing you to modify the response or perform cleanup.

### Key Takeaway

**Middleware positioning in the array doesn't determine when it runs relative to handlers.**
All middleware runs before handlers. To run logic after handlers,
use `await next()` within your middleware to delegate to the rest of the chain,
then add your post-handler code after the await.

## ⚠️ Always await or return next()

Here's a critical rule that prevents subtle bugs: never call `next()` by itself.

Every middleware must either `await next()` or `return next()`.

Never call `next()` without one of these.

```ts
// ❌ WRONG - Silent bugs ahead
use(async (ctx, next) => {
  console.log("Before");
  next(); // DANGER! Not awaited or returned // [!code hl]
  console.log("After");
});

// ✅ CORRECT - Async middleware
use(async (ctx, next) => {
  console.log("Before");
  await next();
  console.log("After");
});

// ✅ CORRECT - Sync middleware
use((ctx, next) => {
  console.log("Before");
  return next();
});
```

This might seem like a minor detail, but it has serious consequences.

### Why this matters:

When you call `next()` without `await` or `return`, errors thrown by downstream middleware escape the error handling chain.

If the next middleware throws an error, it happens outside your middleware's execution context -
error handlers can't catch it, and it may crash your entire process!

`KosmoJS` could automatically wrap every middleware in error handlers to work around this,
but doing so would defeat the purpose of Koa's onion model.

The middleware chain is designed to handle errors gracefully when you properly await or return the `next()` call.

Simple rule: If your middleware is async, use `await next()`.
If it's synchronous, use `return next()`. Always one or the other.
