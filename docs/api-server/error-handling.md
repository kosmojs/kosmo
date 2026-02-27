---
title: Error Handling
description: Handle errors gracefully in KosmoJS with customizable error handler middleware.
    Learn about default error handling, route-level overrides, and best practices for clean error management.
head:
  - - meta
    - name: keywords
      content: error handling, koa errors, error middleware, ctx.throw, ctx.assert,
        error handler slot, custom error handler, error logging
---

Errors happen. The question is how you handle them.

`KosmoJS` provides a lean default error handler that works for most cases,
while giving you full control to customize it at any level -
globally for your entire API, for route subtrees, or for individual endpoints.

## 📦 Default Error Handler

When you create a source folder, `KosmoJS` generates `api/use.ts` with a basic error handler middleware:

```ts [api/use.ts]
import { ValidationError } from "@kosmojs/api/errors";
import { use } from "_/front/api";

export default [
  use(
    async function useErrorHandler(ctx, next) {
      try {
        await next();
      } catch (error: any) {
        if (error instanceof ValidationError) {
          const { target, errorMessage } = error;
          ctx.status = 400;
          ctx.body = { error: `ValidationError: ${target} - ${errorMessage}` };
        } else {
          ctx.status = error.statusCode || error.status || 500;
          ctx.body = { error: error.message };
        }
      }
    },
    { slot: "errorHandler" }, // slot is essential // [!code hl]
  ),

  // ...
];
```

Thanks to the `errorHandler` slot, this error handler can be overridden or customized at any route level -
giving you flexibility to handle errors differently for specific parts of your API.

The default handler returns JSON error responses, assuming clients expect JSON.

When an error occurs anywhere in your middleware chain or route handlers,
this error handler catches it and formats a consistent response.

## 🎨 Customizing the Error Handler

You can customize the default error handler to match your application's needs.
For example, add error logging or emit events for monitoring:

```ts [api/use.ts]
async function useErrorHandler(ctx, next) {
  try {
    await next();
  } catch (error: any) {
    // ...

    // Emit error event for logging/monitoring // [!code ++:2]
    ctx.app.emit("error", error, ctx);

  }
}
```

You can then add listeners to handle these events:

```ts [api/app.ts]
import { type AppOptions, createApp } from "@kosmojs/api";

export default (options?: AppOptions) => {
  const app = createApp(options);

  app.on("error", (error) => { // [!code focus:4]
    // Log to your monitoring service
    console.error("API Error:", error);
  });

  return app;
};
```

The error handler can return different response formats based on request headers or other context.

## 🎯 Route-Level Error Handlers

For routes that need different error handling behavior,
override the default handler using the `errorHandler` slot.

**Inline override:**

```ts [api/webhooks/github/index.ts]
export default defineRoute(({ use, POST }) => [
  use(async (ctx, next) => {
    try {
      await next();
    } catch (error: any) {
      // Return plain text for webhook responses
      ctx.status = error.statusCode || error.status || 500;
      ctx.body = error.message;
    }
  }, { slot: "errorHandler" }), // [!code hl]

  POST(async (ctx) => {
    // Handle webhook...
  }),
]);
```

**Via use.ts file:**

For multiple routes that need the same error handling, create a `use.ts` file:

```ts [api/webhooks/use.ts]
import { use } from "@kosmojs/api";

export default [
  use(async (ctx, next) => {
    try {
      await next();
    } catch (error: any) {
      // Custom error handling for all webhook routes
      ctx.status = error.statusCode || error.status || 500;
      ctx.body = error.message;

      // Log webhook failures
      console.error(`Webhook error: ${ctx.path}`, error);
    }
  }, { slot: "errorHandler" }), // [!code hl]
];
```

All routes under `/api/webhooks` now use this custom error handler instead of the default.

[More on Route-Level Middleware ➜ ](/api-server/use-middleware/route-level-middleware)

## 🔄 Let Handlers Fail

Don't clutter your handler logic with try-catch blocks. Let handlers throw errors naturally -
the error handler middleware will catch and format them:

```ts
// ❌ DON'T - Unnecessary error handling
GET(async (ctx) => {
  try {
    const user = await fetchUser(ctx.params.id);
    ctx.body = user;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch user" };
  }
});

// ✅ DO - Let the error handler catch it
GET(async (ctx) => {
  const user = await fetchUser(ctx.params.id);
  ctx.assert(user, 404, "User not found");
  ctx.body = user;
});
```

Use `ctx.throw()` and `ctx.assert()` to throw errors with specific status codes.
The error handler middleware wraps your entire middleware chain,
catching errors from any level and formatting them consistently.

This separation of concerns keeps your route handlers focused on business logic
while error handling stays centralized and consistent across your API.
