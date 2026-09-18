---
title: Hono backend
description: Everything specific to a Hono backend folder - how the error handler attaches,
    how middleware reads and writes the context, and how to type variables and bindings globally.
head:
  - - meta
    - name: keywords
      content: hono, kosmojs hono, ctx.json, ctx.req.header, ctx.set, app.onError, HTTPException,
        api/app.ts, api/errors.ts, DefaultVariables, DefaultBindings, hono middleware
---

A folder with `backend: { stack: "hono" }`.
Everything here is Hono-specific; the routing model, validation and fetch clients are the same
for every backend.

## What the folder contains

| File | Hono-specific? |
|---|---|
| `api/app.ts` | **yes** - `app.onError()` plus app middleware |
| `api/errors.ts` | **yes** - returns a `Response`, handles `HTTPException` first |
| `api/dev.ts` | **yes** - `getRequestListener(app.fetch)` from `@hono/node-server` |
| `api/env.d.ts` | **yes** - augments `DefaultVariables` and `DefaultBindings` |
| `api/use.ts` | shared shape, Hono idioms inside |
| `api/server.ts` | no |
| route files | shared shape, Hono idioms inside |

## Attaching the error handler

Hono has a dedicated hook, and `await next()` does **not** throw -
`app.onError()` catches everything:

```ts [api/app.ts]
// Hono: api/app.ts
export default appFactory(routes, ({ app }) => {
  app.onError(defaultErrorHandler);
});
```

The handler returns a `Response`. Hono's own `HTTPException` carries one already,
so the seeded handler returns `error.getResponse()` for it before anything else.

## Responding from a handler

Return the response - Hono ignores anything assigned to the context:

```ts [api/users/[id]/index.ts]
// Hono: api/users/[id]/index.ts
import { HTTPError } from "@kosmojs/core/errors";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const user = await db.users.find(id);

    if (!user) throw new HTTPError([404, "User not found"]);

    return ctx.json(user);
  }),
]);
```

| Task | Hono |
|---|---|
| read a header | `ctx.req.header("authorization")` |
| respond with JSON | `return ctx.json(value)` |
| respond with text | `return ctx.text(message, status)` |
| carry per-request state | `ctx.set("key", value)` / `ctx.get("key")` |

## Global middleware

```ts [api/use.ts]
// Hono: api/use.ts
import { use } from "_/api";

export default [
  // will run on every route
  use(async function requestId(ctx, next) {
    ctx.set("requestId", crypto.randomUUID());
    return next();
  }),
];
```

State goes through `ctx.set()` / `ctx.get()`, not by assignment.

## Method-specific middleware

```ts [api/example/index.ts]
// Hono: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    ctx.set("user", await verifyToken(ctx.req.header("authorization")));
    return next();
  }, {
    on: ["POST"],
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.get("user") is available
  }),
]);
```

## App middleware

Registered on the native instance in `api/app.ts`, this layer runs **before any
route chain** - so KosmoJS helpers such as `ctx.validated` are not available here:

```ts [api/app.ts]
// Hono: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.onError(defaultErrorHandler);

  app.use(async (c, next) => {
    const started = performance.now();
    await next();
    console.log([ c.req.method, c.req.path, performance.now() - started ]);
  });
});
```

Order matters: the error handler goes first, or middleware registered before it
sits outside its reach.

## Folder-level middleware and `UseT`

A `use.ts` in an `api/` subfolder wraps that subtree and may extend the context.
Export `UseT` to type what it adds - the global `api/use.ts` is the exception and
does not export one:

```ts [api/users/use.ts]
// Hono: api/users/use.ts
import { use } from "_/api";

export type UseT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<UseT>(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    // validate before adding to context - UseT promises this property exists
    if (!token) throw new HTTPException(401, { message: "Authentication required" });
    ctx.set("user", await verifyToken(token));
    return next();
  })
];
```

Routes underneath read it with `ctx.get("user")`, fully typed.
Hono's own `HTTPException` is the idiomatic throw here - the seeded error handler
returns its `Response` directly.

## Third-party middleware

Middleware that should join the route chain goes through `use()`:

```ts [api/users/use.ts]
// Hono: api/users/use.ts
import { rateLimiter } from "hono-rate-limiter";

import { use } from "_/api";

export default [
  use(
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      keyGenerator: (ctx) => ctx.req.header("x-forwarded-for") ?? "anonymous",
    }),
  ),
];
```

Middleware that must see **every** request - CORS included - goes on the native
instance in `api/app.ts` instead, because the route chain is skipped for preflight
`OPTIONS` and for `405` responses.

## Edge middleware slots

Slots are not framework-specific - `edge:auth` and `edge:ratelimit` behave the same
on every backend. What differs is the code inside the handler.

Auth that must run before everything, including unmatched routes, belongs on the
native instance:

```ts [api/app.ts]
// Hono: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.onError(defaultErrorHandler);

  app.use(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    if (!token) return ctx.text("Authentication required", 401);
    await next();
  });
});
```

## Dev hooks

`api/dev.ts` tells the dev server how to dispatch:

```ts [api/dev.ts]
// Hono: api/dev.ts
import { getRequestListener } from "@hono/node-server";

import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
});
```

Hono speaks fetch, so the dev server needs `getRequestListener(app.fetch)` to get
a Node listener out of it.

`teardownHandler()` runs before every reload - close DB connections and sockets
there or they leak across restarts.

## Validation errors

`ValidationError` reaches `api/errors.ts` like any other throw:

```ts [api/errors.ts]
// Hono: api/errors.ts
if (error instanceof ValidationError) {
  return ctx.json({ error: error.errorMessage }, 400);
}
```

## Typing the context

Hono splits per-request values from environment bindings, so there are two interfaces:

```ts [api/env.d.ts]
// Hono: api/env.d.ts
export declare module "_/api" {
  interface DefaultVariables {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultBindings {
    KV: KVNamespace;
  }
}
```

Koa augments `DefaultState`/`DefaultContext`, H3 only `DefaultContext`.

## Per-route context typing

Beyond the global `env.d.ts`, a single route widens its own context through
`defineRoute`'s type parameters:

```ts [api/users/[id]/index.ts]
// Hono: api/users/[id]/index.ts
defineRoute<
  "route-name",
  ParamsTuple,      // param refinements
  Variables,        // route-specific locals
  Bindings,         // route-specific bindings
>
```

Hono takes four - the fourth being environment bindings:

```ts [api/users/[id]/index.ts]
// Hono: api/users/[id]/index.ts
export default defineRoute<
  "users/[id]",
  [number],
  { permissions: Array<"read" | "write"> },  // ctx.get("permissions")
  { DB: D1Database },                        // Cloudflare binding
>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const permissions = ctx.get("permissions");
    const db = ctx.env.DB;
  }),
]);
```

## Route templates

`backend.templates` seeds new route files by route-name pattern. The template is a
string, so it has to be written in this backend's idiom:

```ts [kosmo.config.ts]
// Hono: kosmo.config.ts
const template = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    // Always return the response
    return ctx.json({ ok: true });
  }),
]);`;
```

<code v-pre>{{route.name}}</code> is substituted per route.

## Worth knowing

- App middleware registered in `api/app.ts` runs before any route chain,
so KosmoJS helpers like `ctx.validated` are not available there.
- Third-party Hono middleware goes on the native instance in `api/app.ts`,
or into a slot in `api/use.ts` when it should participate in the route chain.
