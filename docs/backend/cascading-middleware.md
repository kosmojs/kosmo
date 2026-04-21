---
title: Cascading Middleware
description: Organize middleware hierarchically using use.ts files that wrap route subtrees.
    Apply authentication, logging, and custom parsers to folders and their descendants
    without cluttering individual route definitions.
head:
  - - meta
    - name: keywords
      content: use.ts files, middleware organization, hierarchical middleware,
        automatic middleware, middleware composition, authentication middleware
---

Place a `use.ts` file in any folder, and its middleware automatically wraps all routes
in that folder and its subfolders - no imports or wiring required.

## 🎯 How it Works

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

- `users/use.ts` wraps all routes under `/api/users`
- `users/account/use.ts` wraps only routes under `/api/users/account`

Execution order for a request to `/api/users/account`:

```txt
api/use.ts               → global middleware
users/use.ts             → parent folder
users/account/use.ts     → current folder
users/account/index.ts   → route handler
```

Parent middleware always runs before child middleware. Child routes cannot skip parent `use.ts`.

The generated boilerplate when you create a new `use.ts`:

```ts [api/users/use.ts]
import { use } from "_/api";

export type ExtendT = {};

export default [
  use<ExtendT>(async (ctx, next) => {
    return next();
  })
];
```

> Some editors load the generated content immediately, others require a brief unfocus/refocus.

Beside the default exported middleware, every `use.ts` exports an `ExtendT` type - even if empty.
This type extends the context for all routes underneath, giving you
automatic type safety for anything the middleware adds.

## 🔗 Type-Safe Context Extension

The whole point of cascading middleware is to avoid manual wiring.
That applies to types too - if your auth middleware adds `user` to the context,
every route underneath should know about it without importing or declaring anything.

`ExtendT` makes this work. Define what your middleware adds:

::: code-group
```ts [Koa: api/admin/use.ts]
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    // NOTE: validate before adding to state - ExtendT promises this property exists
    ctx.assert(token, 401, "Authentication required");
    ctx.state.user = await verifyToken(token);
    return next();
  })
];
```

```ts [Hono: api/admin/use.ts]
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    // NOTE: validate before adding to context - ExtendT promises this property exists
    if (!token) throw new HTTPException(401, { message: "Authentication required" });
    ctx.set("user", await verifyToken(token));
    return next();
  })
];
```
:::

Now every route under `/api/admin` has `user` typed on the context automatically -
no imports, no type arguments on `defineRoute`:

::: code-group
```ts [Koa: api/admin/dashboard/index.ts]
export default defineRoute<"admin/dashboard">(({ GET }) => [
  GET(async (ctx) => {
    const { user } = ctx.state;  // typed as { id: number; role: "admin" | "user" }
  }),
]);
```

```ts [Hono: api/admin/dashboard/index.ts]
export default defineRoute<"admin/dashboard">(({ GET }) => [
  GET(async (ctx) => {
    const user = ctx.get("user");  // typed as { id: number; role: "admin" | "user" }
  }),
]);
```
:::

The code generator imports `ExtendT` from each `use.ts` in the hierarchy
and merges them into the context type for `defineRoute`. Inner definitions
override outer ones - just like at runtime, where inner middleware runs after
outer middleware and can overwrite context values.

**Note:** the global `api/use.ts` does not need to export `ExtendT`.
Even if it does, the export is ignored - global middleware operates on
`DefaultState` (Koa) or `DefaultVariables` (Hono) defined in `api/env.d.ts`.
`ExtendT` is for folder-level `use.ts` files only, where the types cascade
alongside the middleware itself.

> **Tip:** inner `use.ts` files can import `ExtendT` from outer ones, extend it, and re-export -
> avoiding duplicate type definitions across the hierarchy:
>
> ```ts [api/admin/settings/use.ts]
> import type { ExtendT as ParentT } from "../use";
>
> export type ExtendT = ParentT & {
>   settingsAccess: "read" | "write";
> };
> ```

## 💼 Common Use Cases

### Authentication

::: code-group
```ts [Koa: api/admin/use.ts]
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; name: string; role: string };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    ctx.assert(token, 401, "Authentication required");

    const user = await verifyToken(token);
    ctx.assert(user.role === "admin", 403, "Admin access required");

    ctx.state.user = user;
    return next();
  })
];
```

```ts [Hono: api/admin/use.ts]
import { HTTPException } from "hono/http-exception";
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; name: string; role: string };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    if (!token) throw new HTTPException(401, { message: "Authentication required" });

    const user = await verifyToken(token);
    if (user.role !== "admin") throw new HTTPException(403, { message: "Admin access required" });

    ctx.set("user", user);
    return next();
  })
];
```
:::

Every route under `/api/admin` now requires admin auth. Route handlers can assume
the user is already validated (`ctx.state.user` for Koa, `ctx.get("user")` for Hono).

### Request Logging

::: code-group
```ts [Koa: api/payments/use.ts]
import { use } from "_/api";

export type ExtendT = {
  requestId: string;
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    ctx.state.requestId = requestId;
    console.log(`[${requestId}] ${ctx.method} ${ctx.path}`);

    try {
      await next();
    } finally {
      console.log(`[${requestId}] completed in ${Date.now() - start}ms`);
    }
  })
];
```

```ts [Hono: api/payments/use.ts]
import { use } from "_/api";

export type ExtendT = {
  requestId: string;
};

export default [
  use<ExtendT>(async (ctx, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    ctx.set("requestId", requestId);
    console.log(`[${requestId}] ${ctx.req.method} ${ctx.req.path}`);

    await next();
    console.log(`[${requestId}] completed in ${Date.now() - start}ms`);
  })
];
```
:::

### Rate Limiting

::: code-group
```ts [Koa: api/public/use.ts]
import rateLimit from "koa-ratelimit";
import { use } from "_/api";

export type ExtendT = {};

export default [
  use<ExtendT>(
    rateLimit({
      driver: "memory",
      db: new Map(),
      duration: 60000,
      max: 100,
    })
  )
];
```

```ts [Hono: api/public/use.ts]
import { rateLimiter } from "hono-rate-limiter";
import { use } from "_/api";

export type ExtendT = {};

export default [
  use<ExtendT>(
    rateLimiter({
      windowMs: 60000,
      limit: 100,
      keyGenerator: (ctx) => ctx.req.header("x-forwarded-for") ?? "",
    }),
  )
];
```
:::

## ⚠️ Parameter Availability

Cascading middleware runs for all routes in the hierarchy, including ones that don't
define the parameters you might expect:

```txt
api/users/
├── [id]/index.ts    ← has 'id' param
├── index.ts         ← NO 'id' param
└── use.ts
```

`ctx.params.id` is undefined for `/users`. Keep cascading middleware generic -
authentication, logging, rate limiting. Parameter-specific logic belongs in the route handler.

## 🎨 Multiple Middleware + Method Filtering

A single `use.ts` can define multiple functions, and each supports the `on` option:

::: code-group
```ts [Koa: api/users/use.ts]
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; name: string };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    console.log(`${ctx.method} ${ctx.path}`);
    return next();
  }),

  use<ExtendT>(
    async (ctx, next) => {
      const token = ctx.headers.authorization?.replace("Bearer ", "");
      ctx.assert(token, 401, "Authentication required");
      ctx.state.user = await verifyToken(token);
      return next();
    },
    { on: ["POST", "PUT", "PATCH", "DELETE"] },
  ),

  use<ExtendT>(async (ctx, next) => {
    const start = Date.now();
    await next();
    ctx.set("X-Response-Time", `${Date.now() - start}ms`);
  }),
];
```

```ts [Hono: api/users/use.ts]
import { HTTPException } from "hono/http-exception";
import { use } from "_/api";

export type ExtendT = {
  user: { id: number; name: string };
};

export default [
  use<ExtendT>(async (ctx, next) => {
    console.log(`${ctx.req.method} ${ctx.req.path}`);
    return next();
  }),

  use<ExtendT>(
    async (ctx, next) => {
      const token = ctx.req.header("authorization")?.replace("Bearer ", "");
      if (!token) throw new HTTPException(401, { message: "Authentication required" });
      ctx.set("user", await verifyToken(token));
      return next();
    },
    { on: ["POST", "PUT", "PATCH", "DELETE"] },
  ),

  use<ExtendT>(async (ctx, next) => {
    const start = Date.now();
    await next();
    ctx.header("X-Response-Time", `${Date.now() - start}ms`);
  }),
];
```
:::
