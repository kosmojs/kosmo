---
title: Error Handling
description: Handle errors gracefully in KosmoJS with customizable error handlers for Koa and Hono.
    Learn about default error handling, route-level overrides, and framework differences.
head:
  - - meta
    - name: keywords
      content: error handling, koa errors, hono errors, ValidationError, HTTPException,
        error handler slot, custom error handler, error logging
---

`KosmoJS` generates `api/errors.ts` file with a working default error handler when you create a source folder.
It's a regular file - customize it freely.

## 📦 Default Error Handler

::: code-group
```ts [Koa: api/errors.ts]
import { ValidationError } from "@kosmojs/core/errors";
import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(
  async function defaultErrorHandler(ctx, next) {
    try {
      await next();
    } catch (error: any) {
      const [errorMessage, status] =
        error instanceof ValidationError
          ? [`${error.target}: ${error.errorMessage}`, 400]
          : [error.message, error.statusCode || 500];

      if (ctx.accepts("json")) {
        ctx.status = status;
        ctx.body = { error: errorMessage };
      } else {
        ctx.status = status;
        ctx.body = errorMessage;
      }
    }
  },
);
```

```ts [Hono: api/errors.ts]
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";
import { ValidationError } from "@kosmojs/core/errors";
import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    // HTTPException knows how to render itself
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const [message, status] =
      error instanceof ValidationError
        ? [`${error.target}: ${error.errorMessage}`, 400]
        : [error.message, error.statusCode || 500];

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
:::

The Koa handler is wired into global middleware at `api/use.ts` via `errorHandler` slot.
The Hono handler is wired into `app.onError()` in the `api/app.ts`.

## 🎨 Customization

Add logging, monitoring, or structured error responses directly in `api/errors.ts`:

::: code-group
```ts [Koa]
async function defaultErrorHandler(ctx, next) {
  try {
    await next();
  } catch (error: any) {
    ctx.app.emit("error", error, ctx); // [!code ++]
    // ... rest of error handling
  }
}
```

```ts [Hono]
async function defaultErrorHandler(error, ctx) {
  console.error(`[${ctx.req.method}] ${ctx.req.path}:`, error); // [!code ++]
  await reportToSentry(error); // [!code ++]

  if (error instanceof HTTPException) return error.getResponse();
  // ... rest of error handling
}
```
:::

For Koa, you can listen to app-level error events in `api/app.ts`:

```ts [api/app.ts]
export default appFactory(({ createApp }) => {
  const app = createApp();

  app.on("error", (error) => { // [!code focus:3]
    console.error("API Error:", error);
  });

  app.use(router.routes());
  return app;
});
```

## 🎯 Route-Level Overrides (Koa)

Koa supports overriding the error handler per-route or per-subtree via `errorHandler` slot:

```ts [api/webhooks/github/index.ts]
export default defineRoute(({ use, POST }) => [
  use(async (ctx, next) => {
    try {
      await next();
    } catch (error: any) {
      ctx.status = error.statusCode || 500;
      ctx.body = error.message; // plain text for webhooks
    }
  }, { slot: "errorHandler" }), // [!code hl]

  POST(async (ctx) => { /* ... */ }),
]);
```

For multiple routes, use a cascading `use.ts`:

```ts [api/webhooks/use.ts]
export default [
  use(async (ctx, next) => {
    try {
      await next();
    } catch (error: any) {
      ctx.status = error.statusCode || 500;
      ctx.body = error.message;
      console.error(`Webhook error: ${ctx.path}`, error);
    }
  }, { slot: "errorHandler" }),
];
```

Hono has a single `app.onError()` for the entire application - branch on `ctx.req.path`
inside the handler if you need route-specific behavior.

## 🔄 Let Handlers Fail

Don't wrap handler logic in try-catch. Let errors propagate to the error handler:

::: code-group
```ts [Koa]
// ❌ unnecessary
GET(async (ctx) => {
  try {
    const user = await fetchUser(ctx.params.id);
    ctx.body = user;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch user" };
  }
});

// ✅ use ctx.assert / ctx.throw
GET(async (ctx) => {
  const user = await fetchUser(ctx.params.id);
  ctx.assert(user, 404, "User not found");
  ctx.body = user;
});
```

```ts [Hono]
// ❌ unnecessary
GET(async (ctx) => {
  try {
    const user = await fetchUser(ctx.validated.params.id);
    return ctx.json(user);
  } catch (error) {
    return ctx.json({ error: "Failed to fetch user" }, 500);
  }
}),

// ✅ use HTTPException
GET(async (ctx) => {
  const user = await fetchUser(ctx.validated.params.id);
  if (!user) throw new HTTPException(404, { message: "User not found" });
  return ctx.json(user);
}),
```
:::

## ⚡ Koa vs Hono - Key Differences

| | Koa | Hono |
|---|---|---|
| Error model | Middleware try-catch, bubbles up | `app.onError()` catches everything |
| `await next()` throws? | Yes | No |
| Response style | Mutate `ctx.body` / `ctx.status` | Return a `Response` |
| Per-route override | `errorHandler` slot | Branch inside `app.onError()` |
