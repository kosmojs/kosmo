---
title: Middlewrappers
description: Organize middleware hierarchically using use.ts files that wrap route subtrees.
    Apply authentication, logging, and custom parsers to folders and their descendants
    without cluttering individual route definitions.
head:
  - - meta
    - name: keywords
      content: middlewrappers, use.ts files, middleware organization, hierarchical middleware,
        automatic middleware, middleware composition, authentication middleware
---

Defining middleware in every route file becomes tedious as your application grows.
You end up repeatedly importing/declaring the same authentication checks, logging setup,
or body parser overrides across dozens of routes.

`KosmoJS` solves this with `Middlewrappers` (middleware wrappers).

Create a `use.ts` file in any folder, and its default exported middleware
automatically wraps all routes in that folder and its subfolders -
no imports or manual wiring required.

This hierarchical approach lets you organize middleware the same way you organize routes,
keeping related concerns together and eliminating repetition.

## 🎯 How Middlewrappers Work

The pattern is straightforward: place a `use.ts` file in a folder,
and every route beneath that folder inherits its middleware.

```txt
api/users/
├── about/
│   └── index.ts
├── account/
│   ├── index.ts
│   └── use.ts
├── index.ts
└── use.ts
```

In this structure:
- `users/use.ts` wraps **all routes** under `/api/users` (including `about`, `account`, and the users index)
- `users/account/use.ts` wraps **only** routes under `/api/users/account`

When a request hits `/api/users/account`, the middleware execution order is:
1. Global middleware from `core/api/use.ts`
2. `users/use.ts` (parent folder)
3. `users/account/use.ts` (current folder)
4. Route-specific middleware from `users/account/index.ts`
5. Final route handler

Parent middleware always runs before child middleware.
This predictable order mirrors the folder hierarchy, making it easy to reason about what executes when.

## 📝 Creating Middlewrappers

When you create a new `use.ts` file, `KosmoJS` instantly generates boilerplate content.

> Depending on your editor, this content may appear immediately or after briefly unfocusing and refocusing the file.

The generated structure gives you a starting point:

```ts [api/users/use.ts]
import { use } from "@kosmojs/api";

export default [
  use(async (ctx, next) => {
    // Your middleware logic here
    return next();
  })
];
```

You can define multiple middleware in a single `use.ts` file,
and they'll execute in the order you define them.

Each middleware follows Koa's standard pattern: receive the context and next function,
do your work, then call `next()` to pass control to the next middleware or handler.

## 🔐 Common Use Cases

### Authentication

Apply authentication to entire route subtrees without repeating the logic:

```ts [api/admin/use.ts]
import { use } from "@kosmojs/api";

export default [
  use(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", ""); // [!code focus:8]
    ctx.assert(token, 401, "Authentication required");

    const user = await verifyToken(token);
    ctx.assert(user.role === "admin", 403, "Admin access required");

    ctx.state.user = user;
    return next();
  })
];
```

Now every route under `/api/admin` requires admin authentication.
Individual route files can focus on their business logic,
assuming `ctx.state.user` is already validated and available.

### Request Logging

Add structured logging for specific parts of your API:

```ts [api/payments/use.ts]
import { use } from "@kosmojs/api";

export default [
  use(async (ctx, next) => {
    const start = Date.now(); // [!code focus:12]
    const requestId = crypto.randomUUID();

    ctx.state.requestId = requestId;
    console.log(`[${requestId}] ${ctx.method} ${ctx.path}`);

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      console.log(`[${requestId}] completed in ${duration}ms`);
    }
  })
]);
```

The onion model allows you to do work both before and after the route handler executes,
perfect for timing, logging, or cleaning up resources.

### Body Parser Overrides

Override the default JSON body parser for routes that need different formats:

```ts [api/webhooks/use.ts]
import { use } from "@kosmojs/api";
import bodyparser from "@kosmojs/api/bodyparser";

export default [
  use(bodyparser.raw(), {
    on: ["POST"],
    slot: "bodyparser", // slot is essential [!code hl]
  })
];
```

By using the `bodyparser` slot, this replaces the default JSON parser
for all routes under `/api/webhooks`.

Remember to specify the `on` option when using slots -
slot configurations don't inherit from the middleware they replace.
([Details ➜ ](/api-server/use-middleware/slot-composition))

### Rate Limiting

Apply rate limits to specific endpoint groups:

```ts [api/public/use.ts]
import { use } from "@kosmojs/api";
import rateLimit from "koa-ratelimit";

export default [
  use(
    rateLimit({
      driver: "memory",
      db: new Map(),
      duration: 60000, // 1 minute
      max: 100,
    })
  )
];
```

Public endpoints get rate limiting, while internal or authenticated endpoints
(in different folders) don't inherit this restriction.

## ⚠️ Important Considerations

### Parameter Availability

Middlewrappers run for all routes in their folder hierarchy,
including routes that may not define all the parameters you expect.

```txt
api/users/
├── [id]/
│   ├── posts/
│   │   └── index.ts    // Has 'id' param
│   └── index.ts        // Has 'id' param
├── index.ts            // NO 'id' param
└── use.ts
```

If `users/use.ts` tries to access `ctx.params.id`, it will work for `/users/123`
but `ctx.params.id` will be undefined for `/users`.

Keep middlewrappers generic. Focus on concerns that apply uniformly -
authentication, logging, body parsing - rather than parameter-specific logic.

If you need parameter validation or transformation, do it in the route handler itself
or in route-specific middleware defined within that route's `index.ts`.

### Middleware Hierarchy

Middlewrappers execute from the outermost scope inward:

```txt
api/
├── use.ts               // Runs 2nd (after global)
└── admin/
    ├── use.ts           // Runs 3rd
    └── users/
        ├── use.ts       // Runs 4th
        └── [id]/
            └── index.ts // Runs 5th (route handler)
```

For a request to `/api/admin/users/123`:
1. Global middleware (`core/api/use.ts`)
2. `api/use.ts`
3. `api/admin/use.ts`
4. `api/admin/users/use.ts`
5. Route-specific middleware from `api/admin/users/[id]/index.ts`
6. Final route handler

You cannot skip parent middlewrappers.
If a parent folder has `use.ts`, all child routes inherit it.
This constraint keeps the middleware hierarchy predictable.

### Method-Specific Middlewrappers

Just like inline middleware, you can restrict middlewrappers to specific HTTP methods:

```ts [api/users/use.ts]
import { use } from "@kosmojs/api";

export default [
  use(
    async (ctx, next) => {
      // Authentication required for state-changing operations
      const token = ctx.headers.authorization?.replace("Bearer ", "");
      ctx.assert(token, 401, "Authentication required");
      ctx.state.user = await verifyToken(token);
      return next();
    },
    { on: ["POST", "PUT", "PATCH", "DELETE"] },
  )
];
```

This middleware only runs for methods that modify data,
leaving GET requests public and unauthenticated.

## 🎨 Multiple Middleware in One Middlewrapper

A single `use.ts` can define multiple middleware functions.
They execute in the order you define them:

```ts [api/users/use.ts]
import { use } from "@kosmojs/api";

export default [
  // First: Logging
  use(async (ctx, next) => {
    console.log(`Request: ${ctx.method} ${ctx.path}`);
    return next();
  }),

  // Second: Authentication (only for certain methods)
  use(
    async (ctx, next) => {
      const token = ctx.headers.authorization?.replace("Bearer ", "");
      ctx.assert(token, 401, "Authentication required");
      ctx.state.user = await verifyToken(token);
      return next();
    },
    { on: ["POST", "PUT", "DELETE"] },
  ),

  // Third: Request timing
  use(async (ctx, next) => {
    const start = Date.now();
    await next();
    ctx.set("X-Response-Time", `${Date.now() - start}ms`);
  }),
];
```

This keeps related middleware organized in one place while maintaining clear separation of concerns.

## 💡 Best Practices

**Use for cross-cutting concerns:** Authentication, logging, rate limiting, and CORS are perfect candidates.
These apply broadly to groups of routes.

**Keep it generic:** Avoid parameter-specific logic or assumptions about request structure
that won't hold for all routes in the hierarchy.

**Use slots for overrides:** Use the `slot` option when you need to replace global middleware -
without slot your middleware runs alongside the global middleware instead of replacing it.

**Organize by feature:** If you have a `/api/admin` section with different authentication requirements,
give it its own `use.ts` rather than adding conditional logic to a parent middleware.

**Consider middleware composition:** A deeply nested route might inherit middlewrappers from multiple `use.ts` files.
Make sure they compose well - each layer should add value without conflicting with parent middlewrappers.

**Document middleware behavior:** Leave comments in your `use.ts` files explaining what they do
and why they're needed. Future you (and your teammates) will appreciate the context.

---

Middlewrappers transform how you organize cross-cutting concerns.
Instead of scattering the same authentication checks across dozens of files,
you define them once at the appropriate level and let the hierarchy do the work.

As your API grows, this pattern keeps your codebase maintainable
by mirroring your route structure in your middleware organization.
