---
title: Error Handling
description: Handle errors gracefully in KosmoJS with customizable error handlers for Hono, H3 and Koa.
    Learn about default error handling, route-level overrides, and framework differences.
head:
  - - meta
    - name: keywords
      content: error handling, hono errors, h3 errors, koa errors, ValidationError, HTTPException,
        error handler slot, custom error handler, error logging
---

Error handling starts with `api/errors.ts` file, customize it at your needs:

## Default Error Handler

:::tabs key:backend variant:code
== Hono
```ts
<!--@include: @/parts/backend/error-handling/default-handler.md#hono-->
```

== H3
```ts
<!--@include: @/parts/backend/error-handling/default-handler.md#h3-->
```

== Koa
```ts
<!--@include: @/parts/backend/error-handling/default-handler.md#koa-->
```
:::

It's a regular file - customize it freely. It is then wired into `api/app.ts`:
- *Hono*: `app.onError(defaultErrorHandler)`
- *H3*: `app.use(onError(defaultErrorHandler))`
- *Koa*: `app.use(defaultErrorHandler)`

## Key differences by framework

| Framework | Details       |
|-----------|---------------|
| **Hono** | `app.onError()` catches everything (`await next()` does **not** throw); returns a `Response`. Per‑route behavior by branching inside `app.onError()`. |
| **H3** | `app.use(onError(errorHandler))` captures any thrown error; returns a `Response`, plain object or string. Branch inside `errorHandler` based on `event.url` or other properties. |
| **Koa** | `defaultErrorHandler` is a middleware that wraps `await next()` in a `try`/`catch` and set `ctx.status`/`ctx.body` when errors thrown. |

---

#### Summary

- **Hono** - `onError` is the single entry point; you return a `Response`.
- **H3** - `onError` behaves like Hono's: you return the response directly.
- **Koa** - `await next()` throws. Errors captured in a middleware.

## Let Handlers Fail

The whole point of a central handler is that route code doesn't have to think about error responses.
So don't wrap handler logic in `try`/`catch` just to turn a failure into a response - throw, and let it propagate:

:::tabs key:backend variant:code
== Hono
```ts
<!--@include: @/parts/backend/error-handling/let-handlers-fail.md#hono-->
```

== H3
```ts
<!--@include: @/parts/backend/error-handling/let-handlers-fail.md#h3-->
```

== Koa
```ts
<!--@include: @/parts/backend/error-handling/let-handlers-fail.md#koa-->
```
:::

> `HTTPError` takes a single `[status, message]` **tuple**, not two arguments.

```ts
// ❌ don't - the error never reaches api/errors.ts,
//    the status is invented locally, and nothing gets logged centrally
GET(async (ctx) => {
  try {
    // ...
  } catch (error) {
    // ...
  }
});
```

A per-route `catch` costs you three things: the response shape drifts from every other endpoint,
whatever logging/reporting you added to `api/errors.ts` never sees the failure,
and a `ValidationError` caught this way loses its structured `target`/`errors` detail.

`throw` is also how you signal an *expected* failure. The seeded handler understands several shapes:

- `HTTPError` (from `@kosmojs/core/errors`) - status plus message, in every framework.
- Your framework's native error - `HTTPException` (Hono), `HTTPError` (H3), `ctx.throw()`/`ctx.assert()` (Koa).
- A `[status, message]` tuple - the shorthand the seeded handler destructures first.
- `ValidationError` - thrown for you by the validation layer; answered with a 400.
- Anything else - `error.statusCode || 500`.

**Catch inside a handler only when you intend to recover** - falling back to a cached value,
retrying a flaky upstream, or converting a third-party error into a meaningful one.
Then re-throw what you can't handle:

```ts
try {
  // ...
} catch (error) {
  if (error instanceof UpstreamTimeout) {
    // ... real recovery
  }
  throw error; // not ours to handle - let api/errors.ts decide
}
```

The same rule holds for middleware: code after `await next()` runs on the way out,
so wrapping `next()` in `try`/`catch` swallows errors for everything downstream.

Put cross-cutting error concerns in `api/errors.ts` instead - it is a regular file
you own, and it is the one place that sees every failure.
