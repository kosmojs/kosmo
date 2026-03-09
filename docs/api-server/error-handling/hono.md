---
title: Error Handling
description: Handle errors gracefully in KosmoJS with Hono's built-in error handler.
    Learn about the default error handler, customization, and best practices for clean error management.
head:
  - - meta
    - name: keywords
      content: error handling, hono errors, app.onError, HTTPException,
        error handler, custom error handler, error logging, validation errors
---

Unlike middleware-based error handling (where you wrap `await next()` in a try-catch),
`Hono` catches all errors internally and routes them to a single `app.onError()` callback.

This means errors thrown anywhere - in middleware, handlers, or validation -
all flow to one centralized place. No try-catch chains, no error propagation to worry about.

## 📦 Default Error Handler

When you create a source folder, `KosmoJS` generates `api/errors.ts` with a default error handler:

```ts [api/errors.ts]
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";

import { ValidationError } from "@kosmojs/api/errors";

import { errorHandlerFactory } from "_/front/api-factory";

export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    // Let Hono's HTTPException handle its own response
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const [message, status] =
      error instanceof ValidationError
        ? [`${error.target}: ${error.errorMessage}`, 400]
        : [error.message, error.statusCode || 500];

    // Respond based on what the client accepts
    const type = accepts(ctx, {
      header: "Accept",
      supports: ["application/json", "text/plain"],
      default: "text/plain",
    });

    return type === "application/json"
      ? ctx.json({ error: message }, status)
      : ctx.text(message, status);
  },
);
```

This file is yours - update and adapt it to your needs.
It is imported and wired into `app.onError()` automatically in the generated `api/app.ts`.

The default handler does three things:

1. Passes `HTTPException` responses through untouched - Hono's native error type knows how to render itself.
2. Formats `ValidationError` from KosmoJS's validation layer with the target and message.
3. Content-negotiates the response - JSON for API clients, plain text otherwise.

## 🎨 Customizing the Error Handler

Since `api/errors.ts` is a regular file in your source folder,
you can modify it however you like.

**Add logging or monitoring:**

```ts [api/errors.ts]
export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    // Log all errors
    console.error(`[${ctx.req.method}] ${ctx.req.path}:`, error);

    // Report to your monitoring service
    await reportToSentry(error, {
      method: ctx.req.method,
      path: ctx.req.path,
    });

    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    // ... rest of error handling
  },
);
```

**Return structured error responses:**

```ts [api/errors.ts]
export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const status = error instanceof ValidationError
      ? 400
      : error.statusCode || 500;

    return ctx.json({
      error: {
        message: error.message,
        code: error.code ?? "UNKNOWN_ERROR",
        ...(error instanceof ValidationError && {
          target: error.target,
          details: error.errorMessage,
        }),
      },
    }, status);
  },
);
```

## 🚨 Throwing Errors in Handlers

Hono provides `HTTPException` for throwing errors with specific status codes.
The error handler catches these automatically:

```ts
import { HTTPException } from "hono/http-exception";

GET(async (ctx) => {
  const user = await fetchUser(ctx.validated.params.id);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return ctx.json(user);
}),
```

You can also attach a custom response to an `HTTPException`:

```ts
throw new HTTPException(401, {
  res: new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": "Bearer" },
  }),
});
```

When the error handler encounters an `HTTPException` with a `res` property,
`error.getResponse()` returns that exact response - headers and all.

## 🔄 Let Handlers Fail

Don't clutter your handler logic with try-catch blocks.
Let handlers throw errors naturally - the error handler catches and formats them:

```ts
// ❌ DON'T - Unnecessary error handling in the handler
GET(async (ctx) => {
  try {
    const user = await fetchUser(ctx.validated.params.id);
    return ctx.json(user);
  } catch (error) {
    return ctx.json({ error: "Failed to fetch user" }, 500);
  }
}),

// ✅ DO - Let the error handler catch it
GET(async (ctx) => {
  const user = await fetchUser(ctx.validated.params.id);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return ctx.json(user);
}),
```

This separation of concerns keeps your route handlers focused on business logic
while error handling stays centralized and consistent across your API.

## ⚡ Key Differences from Koa

If you're coming from Koa, note these important differences:

**Errors don't bubble through middleware.**
In Koa, you wrap `await next()` in try-catch to handle downstream errors.
In Hono, `await next()` never throws - errors are caught internally
and routed to `app.onError()`.

**Always return responses.**
Koa lets you set `ctx.body` and `ctx.status` as mutations.
Hono requires you to return a `Response` - including from the error handler.

**Single centralized handler.**
Koa supports error handler middleware at any level via the `errorHandler` slot.
Hono has one `app.onError()` callback for the entire application.
If you need different error handling for different routes,
branch on `ctx.req.path` inside the error handler.
