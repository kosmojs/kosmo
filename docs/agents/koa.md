---
title: Koa backend
description: Everything specific to a Koa backend folder - how the error handler attaches,
    how middleware reads and writes the context, and how to type ctx.state and ctx globally.
head:
  - - meta
    - name: keywords
      content: koa, kosmojs koa, ctx.state, ctx.body, ctx.headers, api/app.ts, api/errors.ts,
        DefaultState, DefaultContext, koa middleware, defineRoute koa
---

A folder with `backend: { stack: "koa" }`.
Everything here is Koa-specific; the routing model, validation and fetch clients are the same
for every backend.

## What the folder contains

| File | Koa-specific? |
|---|---|
| `api/app.ts` | **yes** - how the error handler and app middleware attach |
| `api/errors.ts` | **yes** - a middleware wrapping `await next()` in try/catch |
| `api/dev.ts` | **yes** - `requestHandler()` returns `app.callback()` |
| `api/env.d.ts` | **yes** - augments `DefaultState` and `DefaultContext` |
| `api/use.ts` | shared shape, Koa idioms inside |
| `api/server.ts` | no |
| route files | shared shape, Koa idioms inside |

## Attaching the error handler

`defaultErrorHandler` is a middleware on Koa, not a hook - it wraps `await next()`
in a `try`/`catch` and sets `ctx.status` / `ctx.body` when something throws:

```ts [api/app.ts]
// Koa: api/app.ts
export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);
});
```

Hono uses `app.onError()` and H3 uses `app.use(onError(...))`.
Copying either onto Koa leaves errors unhandled.

## Responding from a handler

Assign to `ctx.body`. Do not return the value - Koa ignores a returned body:

```ts [api/users/[id]/index.ts]
// Koa: api/users/[id]/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    ctx.body = { id, name: "Jane Smith", email: "jane@example.com" };
  }),
]);
```

| Task | Koa |
|---|---|
| read a header | `ctx.headers.authorization` |
| respond | `ctx.body = value` |
| set a status | `ctx.status = 400` |
| carry per-request state | `ctx.state.x = value` |

## Global middleware

```ts [api/use.ts]
// Koa: api/use.ts
import { use } from "_/api";

export default [
  // will run on every route
  use(async function requestId(ctx, next) {
    ctx.state.requestId = crypto.randomUUID();
    return next();
  }),
];
```

State goes on `ctx.state`, not on `ctx` itself.

## Method-specific middleware

```ts [api/example/index.ts]
// Koa: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    ctx.state.user = await verifyToken(ctx.headers.authorization);
    return next();
  }, {
    on: ["POST"],
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.state.user is available
  }),
]);
```

## App middleware

Registered on the native instance in `api/app.ts`, this layer runs **before any
route chain** - so KosmoJS helpers such as `ctx.validated` are not available here:

```ts [api/app.ts]
// Koa: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);

  app.use(async (ctx, next) => {
    const started = performance.now();
    await next();
    console.log([ ctx.method, ctx.path, performance.now() - started ]);
  });
});
```

Order matters: the error handler goes first, or middleware registered before it
throws outside its try/catch.

## Folder-level middleware and `UseT`

A `use.ts` in an `api/` subfolder wraps that subtree and may extend the context.
Export `UseT` to type what it adds - the global `api/use.ts` is the exception and
does not export one:

```ts [api/users/use.ts]
// Koa: api/users/use.ts
import { use } from "_/api";

export type UseT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<UseT>(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    // validate before adding to state - UseT promises this property exists
    ctx.assert(token, 401, "Authentication required");
    ctx.state.user = await verifyToken(token);
    return next();
  })
];
```

`ctx.assert(value, status, message)` is Koa's own guard and the idiomatic way to
fail here. Routes underneath then read `ctx.state.user` fully typed.

## Third-party middleware

Koa middleware that should join the route chain goes through `use()`:

```ts [api/users/use.ts]
// Koa: api/users/use.ts
import ratelimit from "koa-ratelimit";

import { use } from "_/api";

const db = new Map();

export default [
  use(ratelimit({ driver: "memory", db, duration: 15 * 60 * 1000, max: 100 })),
];
```

Middleware that must see **every** request - CORS included - goes on the native
instance in `api/app.ts` instead, because the route chain is skipped for preflight
`OPTIONS` and for `405` responses.

## Edge middleware slots

Slots are not Koa-specific - `edge:auth` and `edge:ratelimit` behave the same on
every backend. What is Koa-specific is the code inside: a slot handler is an
ordinary Koa middleware, so it reads `ctx.headers` and guards with `ctx.assert`.

Auth that must run before everything, including unmatched routes, belongs on the
native instance:

```ts [api/app.ts]
// Koa: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);

  app.use(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    ctx.assert(token, 401, "Authentication required");
    await next();
  });
});
```

## Dev hooks

`api/dev.ts` tells the dev server how to dispatch. On Koa that means handing back
`app.callback()`, the Node request listener:

```ts [api/dev.ts]
// Koa: api/dev.ts
import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
});
```

`teardownHandler()` runs before every reload - close DB connections and sockets
there or they leak across restarts.

## Validation errors

`ValidationError` reaches `api/errors.ts` like any other throw. Koa sets the
status and body rather than returning a response:

```ts [api/errors.ts]
// Koa: api/errors.ts
if (error instanceof ValidationError) {
  ctx.status = 400;
  ctx.body = { error: error.errorMessage };
}
```

## Typing the context

Koa has two surfaces, so there are two interfaces to augment -
`DefaultState` for `ctx.state`, `DefaultContext` for things placed on `ctx` itself:

```ts [api/env.d.ts]
// Koa: api/env.d.ts
export declare module "_/api" {
  interface DefaultState {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultContext {
    authorizedUser: User;
  }
}
```

Hono augments `DefaultVariables`/`DefaultBindings`, H3 only `DefaultContext`.

## Per-route context typing

Beyond the global `env.d.ts`, a single route widens its own context through
`defineRoute`'s type parameters:

```ts [api/users/[id]/index.ts]
// Koa: api/users/[id]/index.ts
defineRoute<
  "route-name",
  ParamsTuple,      // param refinements
  State,            // route-specific state/locals
  Context,          // route-specific context properties
>
```

Koa takes four, because state and context are separate surfaces:

```ts [api/users/[id]/index.ts]
// Koa: api/users/[id]/index.ts
export default defineRoute<
  "users/[id]",
  [number],
  { permissions: Array<"read" | "write"> },  // ctx.state.permissions
  { authorizedUser: User },                  // ctx.authorizedUser
>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const { permissions } = ctx.state;
    const { authorizedUser } = ctx;
  }),
]);
```

## Route templates

`backend.templates` seeds new route files by route-name pattern. The template is a
string, so it has to be written in this backend's idiom:

```ts [kosmo.config.ts]
// Koa: kosmo.config.ts
const template = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = { ok: true };
  }),
]);`;
```

<code v-pre>{{route.name}}</code> is substituted per route.

## Worth knowing

- Koa is the only backend with full [power-syntax](/routing/intro.md) support.
- `app.callback()` is a Node request listener, so Koa has no native Deno or Bun serve -
wrap it in `createServer()`.
[Building&nbsp;for&nbsp;production&nbsp;›](/dev-build-run/building-for-production.md)
