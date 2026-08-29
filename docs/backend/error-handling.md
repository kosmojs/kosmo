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
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";

import { ValidationError, HTTPError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (error, ctx) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  const [status, message] = Array.isArray(error)
    ? error
    : error instanceof HTTPError
      ? [error.status, error.message]
      : error instanceof ValidationError
        ? [400, `${error.target}: ${error.errorMessage}`]
        : [error.statusCode || 500, error.message];

  const type = accepts(ctx, {
    header: "Accept",
    supports: ["application/json", "text/plain"],
    default: "text/plain",
  });

  return type === "application/json"
    ? ctx.json({ error: message }, status)
    : ctx.text(message, status);
});
```

== H3
```ts
import { ValidationError } from "@kosmojs/core/errors";
import { HTTPError } from "h3";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (error, event) => {
  const [status, message = "Unknown error occurred"] = Array.isArray(error)
    ? error
    : error instanceof HTTPError
      ? [error.status, error.message]
      : error instanceof ValidationError
        ? [400, `${error.target}: ${error.errorMessage}`]
        : [error.statusCode || 500, error.message];

  const accept = event.req.headers.get("accept");

  return accept?.includes("application/json")
    ? new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    : new Response(message, {
        status,
        headers: { "Content-Type": "text/plain" },
      });
});
```

== Koa
```ts
import { HTTPError, ValidationError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (ctx, next) => {
  try {
    await next();
  } catch (error: any) {
    const [status, message] = Array.isArray(error)
      ? error
      : error instanceof HTTPError
        ? [error.status, error.message]
        : error instanceof ValidationError
          ? [400, `${error.target}: ${error.errorMessage}`]
          : [error.statusCode || 500, error.message];

    ctx.status = status;

    if (ctx.accepts("json")) {
      ctx.body = { error: message };
    } else {
      ctx.body = message;
    }
  }
});
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

```ts [api/users/[id]/index.ts]
import { HTTPError } from "@kosmojs/core/errors";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const user = await db.users.find(id);

    // ✅ throw - api/errors.ts turns it into a response
    if (!user) throw new HTTPError([404, "User not found"]);

    return ctx.json(user);
  }),
]);
```

> `HTTPError` takes a single `[status, message]` **tuple**, not two arguments.

```ts
// ❌ don't - the error never reaches api/errors.ts,
//    the status is invented locally, and nothing gets logged centrally
GET(async (ctx) => {
  try {
    return ctx.json(await db.users.find(id));
  } catch (error) {
    return ctx.json({ error: "something went wrong" }, 500);
  }
});
```

A per-route `catch` costs you three things: the response shape drifts from every other endpoint,
whatever logging/reporting you added to `api/errors.ts` never sees the failure,
and a `ValidationError` caught this way loses its structured `target`/`errors` detail.

`throw` is also how you signal an *expected* failure. The generated handler understands several shapes:

- `HTTPError` (from `@kosmojs/core/errors`) - status plus message, in every framework.
- Your framework's native error - `HTTPException` (Hono), `HTTPError` (H3), `ctx.throw()`/`ctx.assert()` (Koa).
- A `[status, message]` tuple - the shorthand the generated handler destructures first.
- `ValidationError` - thrown for you by the validation layer; answered with a 400.
- Anything else - `error.statusCode || 500`.

**Catch inside a handler only when you intend to recover** - falling back to a cached value,
retrying a flaky upstream, or converting a third-party error into a meaningful one.
Then re-throw what you can't handle:

```ts
try {
  return ctx.json(await upstream.fetchProfile(id));
} catch (error) {
  if (error instanceof UpstreamTimeout) {
    return ctx.json(await cache.profile(id)); // real recovery
  }
  throw error; // not ours to handle - let api/errors.ts decide
}
```

The same rule holds for middleware: code after `await next()` runs on the way out,
so wrapping `next()` in `try`/`catch` swallows errors for everything downstream.

Put cross-cutting error concerns in `api/errors.ts` instead - it is a regular file
you own, and it is the one place that sees every failure.
