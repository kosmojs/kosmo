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
