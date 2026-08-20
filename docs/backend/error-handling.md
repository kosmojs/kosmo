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

::: code-group
```ts [Hono]
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

```ts [H3]
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

```ts [Koa]
import { HTTPError, ValidationError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (error, ctx) => {
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
});
```
:::

It's a regular file - customize it freely. It is then wired into `api/app.ts`:
- *Hono*: `app.onError(defaultErrorHandler)`
- *H3*: `app.use(onError(defaultErrorHandler))`
- *Koa*: `app.on("error", defaultErrorHandler)`

## Key differences by framework

| Framework | Details       |
|-----------|---------------|
| **Hono** | `app.onError()` catches everything (`await next()` does **not** throw); returns a `Response`. Per‑route behavior by branching inside `app.onError()`. |
| **H3** | `app.use(onError(errorHandler))` captures any thrown error; returns a `Response`, plain object or string. Branch inside `errorHandler` based on `event.url` or other properties. |
| **Koa** | Errors bubble up through `await next()`. Koa emits an `error` event (for logging), but doesn't send a response automatically. Use `app.on("error", errorHandler)` to react on `error` event. Use `try`/`catch` around `await next()` in middleware to set `ctx.status`/`ctx.body`. |

---

#### Summary

- **Hono** - `onError` is the single entry point; you return a `Response`.
- **H3** - `onError` behaves like Hono's: you return the response directly.
- **Koa** - The error is emitted as an event, but you must handle the response yourself (typically by catching in middleware). The event is only for logging/debugging.
