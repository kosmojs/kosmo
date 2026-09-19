---
title: Koa backend
description: The complete Koa surface of KosmoJS on one page - configuration, endpoints,
    validation, the middleware ladder, error handling, dev hooks, deployment and typing,
    with every snippet in Koa's own idiom and no other backend's code anywhere on the page.
head:
  - - meta
    - name: keywords
      content: koa, kosmojs koa, ctx.state, ctx.body, ctx.headers, ctx.assert, app.callback,
        api/app.ts, api/errors.ts, api/use.ts, api/dev.ts, DefaultState, DefaultContext,
        koa middleware, koa validation, koa deployment, power syntax
---

A folder with `backend: { stack: "koa" }`.

This page is the **complete Koa surface** of KosmoJS, written to be read on its own:
every snippet on it is Koa, and no other backend's code appears anywhere on the page.
Links go only to framework-agnostic pages; everything Koa-specific is inlined here.

Routing conventions, validation semantics, middleware composition and the typed fetch
clients are identical across backends. What this page fixes is the idiom: handlers
respond by **mutating the context** (`ctx.body`, `ctx.status`), state rides on
`ctx.state`, errors are caught by a middleware - and Koa is the only backend with
complete mixed-segment and power-syntax routing support.

## What the folder contains

Creating a source folder with a Koa backend seeds a small, fixed set of files.
Each is a real source file you own - written once into a blank file, never re-seeded:

```txt
src/<folder>/
├── kosmo.config.ts       -> the folder's config - the backend block lives here
├── tsconfig.json         -> { "extends": "../../lib/<folder>/tsconfig.json" }
└── api/
    ├── app.ts            -> builds the Koa instance - error handler first, app middleware
    ├── server.ts         -> standalone server entry
    ├── dev.ts            -> dev hooks: requestHandler, requestMatcher, teardownHandler
    ├── errors.ts         -> the central error handler - a middleware
    ├── use.ts            -> global middleware - every route in this folder
    ├── env.d.ts          -> DefaultState / DefaultContext, custom UseSlots
    └── users/            ── a route folder ──
        ├── use.ts        -> cascading middleware for /users and everything beneath
        ├── index.ts      -> the route  ->  <backend.base>/users
        ├── types.ts      -> colocated helper, NOT a route
        └── [id]/
            └── index.ts  -> the route  ->  <backend.base>/users/:id
```

`index.ts` and `use.ts` are the only filenames the backend watcher acts on.
Everything else in a route folder is a colocated helper - never a route, never scanned.
[Rationale&nbsp;›](/routing/rationale.md)

| File | Koa-specific? |
|---|---|
| `api/app.ts` | **yes** - error-handler middleware registered first |
| `api/errors.ts` | **yes** - a middleware wrapping `await next()` in try/catch |
| `api/dev.ts` | **yes** - `requestHandler()` returns `app.callback()` |
| `api/env.d.ts` | **yes** - augments `DefaultState` and `DefaultContext` |
| `api/use.ts` | shared shape, Koa idioms inside |
| `api/server.ts` | no |
| route files | shared shape, Koa idioms inside |

## Configuration

The folder's `kosmo.config.ts` declares what the folder is. A backend-only Koa folder:

```ts [kosmo.config.ts]
// Koa: kosmo.config.ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  backend: {
    stack: "koa",
    base: "/api",
  },
  fetch: true,
  validation: true,
  typecheck: true,
});
```

`defineConfig` from `@kosmojs/dev` is the only import a folder config needs.
The config is read once at startup - **restart the dev server** after changing it.

### backend.stack - required

`"koa"`. The object form `{ name: "koa" }` exists for symmetry with the frontend block,
but backend stacks carry no Vite plugin, so the bare name is the usual form.

### backend.base - required

The URL prefix this folder's routes are served from - a **full path**, resolved on its
own, never joined onto a frontend base. A route's final URL is `backend.base` + route
name:

```
base "/api"        route "users/[id]"  ->  /api/users/:id
base "/admin/api"  route "users/[id]"  ->  /admin/api/users/:id
base "/v1"         route "users/[id]"  ->  /v1/users/:id
```

The `api/` directory name never appears in the URL - it only separates server routes
from `pages/` on disk.

### backend.openapi

Derives an OpenAPI 3.1 spec from this folder's routes. Options are required:

```ts
// Koa: kosmo.config.ts
backend: {
  stack: "koa",
  base: "/api",
  openapi: {
    outfile: "openapi.json",
    openapi: "3.1.0",
    info: { title: "My API", version: "1.0.0" },
    servers: [{ url: "https://api.example.com/api" }],
  },
}
```

Each `servers.url` carries the full prefix, origin plus `backend.base` - paths in the
spec are route names and never carry the prefix themselves.
[OpenAPI&nbsp;›](/openapi/intro.md) · [Config&nbsp;details&nbsp;›](/openapi/config.md)

### backend.alias

Serves an existing route at an additional public URL. Keys are **absolute** - not
prefixed by `backend.base` - and dynamic segments must match the target's parameter
names exactly, or the request 404s:

```ts
// Koa: kosmo.config.ts
backend: {
  stack: "koa",
  base: "/api",
  alias: {
    "/feed.xml": "rss",
    "/members/[id]": "users/[id]",
  },
}
```

An alias is another entry pointing at the same handler - middleware, cascading
middleware and validation all come with it. It is not a redirect, and it does not touch
the fetch client or the OpenAPI spec, both keyed by the route's own name.
[Details&nbsp;›](/backend/aliases.md)

### backend.templates

Overrides the seeded route boilerplate by route-name pattern -
see [Route templates](#route-templates) below.

### backend.viteConfig

Vite's `UserConfig` for the API build - `plugins`, `resolve`, `define`, and the rest:

```ts
// Koa: kosmo.config.ts
backend: {
  stack: "koa",
  base: "/api",
  viteConfig: {
    define: { __API_BUILD__: true },
  },
}
```

A handful of Vite keys are not accepted, because KosmoJS derives them from the folder
layout: `root`, `base`, `cacheDir`, `mode`, `builder`, `future`, `legacy`.

### Folder-level keys

- **`fetch: true`** - generate typed [fetch clients](/fetch/intro.md) from this folder's
routes.
- **`validation: true`** - runtime validators derived from your types. For anything
beyond on/off, pass an options object: `validationMessages` (global message overrides,
`node:util.format` placeholders), `customTypesImport` (a file mapping custom TypeBox
types), `refineTypeName` (renames `VRefine` if it collides), and `settings`
(`maxErrors`, `useEval: false` for strict CSP environments, `exactOptionalPropertyTypes`,
`immutableTypes`).
- **`typecheck: false`** - leave the folder out of [kosmo typecheck](/cli/typecheck.md)
runs. It still builds and runs.

## Defining endpoints

Every route default-exports a `defineRoute` definition. The factory receives HTTP method
builders and `use`, and returns an array of handlers - destructure only what you need:

```ts [api/users/index.ts]
// Koa: api/users/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users">(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => { /* retrieve */ }),
  POST(async (ctx) => { /* create */ }),
  PUT(async (ctx) => { /* update */ }),
  DELETE(async (ctx) => { /* delete */ }),
]);
```

Available builders: `HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

Handler order doesn't matter - requests are dispatched by HTTP method.
Undefined methods return `405 Method Not Allowed` automatically.

`HEAD` is the one exception to the 405 rule: a route that defines `GET` but not `HEAD`
still answers HEAD requests through the `GET` handler, validated against its schemas,
with the body dropped as the HTTP spec requires. An explicit `HEAD` builder runs
normally on Koa (unlike Hono, whose router ignores it).

### Responding from a handler

Assign to `ctx.body`. **Do not return the value** - Koa ignores a returned body:

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
| raw params | `ctx.params` - untyped strings |
| validated params | `ctx.validated.params` - typed, coerced, checked |

### The route name type argument

`defineRoute<"users/[id]">` restates the path the file already lives at. Routing never
uses the string - the URL comes from the file's location. The name is the key into the
derived `RouteMap` in `lib/`, and that single lookup is what types
`ctx.validated.params` and the merged cascading `use.ts` context for the route.
Because no runtime argument carries it, TypeScript has nothing to infer it from, so the
type argument is **required** - and the seeded boilerplate already contains it.

It cannot drift silently: `R extends keyof RouteMap`, so a stale name left behind after
renaming a route folder is a compile error caught by [kosmo typecheck](/cli/typecheck.md).

The name is the route path relative to `api/`, without the trailing `index.ts` -
`api/users/[id]/index.ts` is `"users/[id]"`, and `api/index/index.ts` is `"index"`.

## Validating requests

Validation is identical across backends: TypeScript types become TypeBox validators,
run on the server and inside the typed fetch clients.
[Concept&nbsp;›](/validation/intro.md)
What follows is the Koa view of it.

### Params

Pass a tuple as the second type argument; each position refines the corresponding
parameter in path order. Refinements are positional, not name-based:

```ts [api/users/[id]/index.ts]
// Koa: api/users/[id]/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]", [
  VRefine<number, { minimum: 1, multipleOf: 1 }>
]>(({ GET }) => [
  GET(async (ctx) => {
    // id is a validated positive integer
    const { id } = ctx.validated.params;
    ctx.body = { id };
  }),
]);
```

A request to `/api/users/abc` is rejected with a 400 before the handler runs.
Params typed as `number` are coerced first - `"123"` becomes `123` - so you read a real
number from `ctx.validated.params`; `ctx.params` keeps the raw strings. `VRefine` is
globally available, no import needed.
[Params&nbsp;details&nbsp;›](/validation/params.md) ·
[VRefine&nbsp;keywords&nbsp;›](/validation/refine.md)

### Payload

Metadata targets (`query`, `headers`, `cookies`) are valid on every method; body targets
(`json`, `form`, `raw`) on POST/PUT/PATCH only, one per handler. Coercion: `query`
coerces numbers and booleans, `params` numbers only, `json` carries both natively,
`headers`/`cookies`/`form`/`raw` never coerce.
[Targets&nbsp;and&nbsp;coercion&nbsp;›](/validation/payload.md)

```ts [api/users/index.ts]
// Koa: api/users/index.ts
import { defineRoute } from "_/api";
import type { User } from "./types";

export default defineRoute<"users">(({ POST }) => [
  POST<{
    query: { notify?: boolean },
    json: {
      name: VRefine<string, { minLength: 1, maxLength: 255 }>;
      email: VRefine<string, { format: "email" }>;
      age?: number;
    },
    response: [201, "json", User],
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;
    const { notify } = ctx.validated.query;
    const user = await createUser({ name, email, age });
    ctx.status = 201;
    ctx.body = user;
  }),
]);
```

The payload is validated before the handler runs; the response is validated before it is
sent. Imported and generic types (`json: Payload<User>`) resolve fully - every
referenced type is traced, and validation rebuilds when a shared type changes.

### Response

`response` is a positional tuple: `[status, contentType, Schema]`, or a union of tuples
for multiple outcomes - `[201, "json", User] | [409]`. Declaring it switches on four
things at once: response validation, the typed fetch-client return value, the `ResponseT`
entry on the client, and the OpenAPI response schema. Without it the client returns
`Promise<unknown>`.

Response validation is environment-aware: on by default in development and test,
**off in production** unless the handler opts in:

```ts [api/users/index.ts]
// Koa: api/users/index.ts
export default defineRoute<"users">(({ GET }) => [
  GET<{
    response: [200, "json", User],
  },
  {
    response: {
      runtimeValidation: true,
    }
  }>(async (ctx) => {
    ctx.body = await loadUser();
  }),
]);
```

There is no global switch - production response validation is a per-handler decision.
[Details&nbsp;›](/validation/response.md)

### Custom error messages

The same second type argument carries per-target message sets - an `error` fallback plus
`"error.fieldName"` overrides, dot notation for nested fields:

```ts [api/users/index.ts]
// Koa: api/users/index.ts
export default defineRoute<"users">(({ POST }) => [
  POST<
    {
      json: { id: number; email: string },
    },
    {
      json: {
        error: "Invalid user data provided",
        "error.id": "User ID must be a valid number",
        "error.email": "Please provide a valid email address",
      },
    }
  >(async (ctx) => {
    const { id, email } = ctx.validated.json;
    ctx.body = { id, email };
  }),
]);
```

The most specific message wins and lands in each `ValidationErrorEntry.message`,
so the error handler picks it up with no extra wiring.

### Skipping validation

`runtimeValidation: false` on a payload target keeps the compile-time types and skips
the runtime check - the handler then reads the body itself via `ctx.bodyparser`.
Param validation cannot be skipped.
[Details&nbsp;›](/validation/skip-validation.md)

### The silent failures

Four mistakes typecheck cleanly and misbehave at runtime. Check them before debugging
anything else:

1. **A wrapping bracket hidden behind an alias.** The params tuple, the response tuple
and the `VRefine` constraint object must have their `[]` / `{}` written inline; aliases
*inside* them are fine. A hidden params tuple rejects **every** request; a hidden
response tuple builds **no schema at all**.
2. **A type named after a built-in** - `Event`, `Response`, `Date`, `Record`, `Buffer`...
The flattener references the built-in, not your type. Rename: `EventT` / `TEvent`.
3. **Plain `number` where an integer is required** - use
`VRefine<number, { minimum: 1, multipleOf: 1 }>` for IDs, or `1000.5` passes validation
and fails at the database.
4. **A non-string type on a target that doesn't coerce** - `form: { age: number }` can
never pass; accept the wire format and convert in the handler.

[Full&nbsp;checklist&nbsp;›](/validation/gotchas.md)

## The extended context

KosmoJS extends the Koa context with three additions, available in every route chain:

- `ctx.bodyparser` - `.json()` / `.form()` / `.raw()`, async, cached per request
- `ctx.metaparser` - `.params()` / `.query()` / `.headers()` / `.cookies()`, sync,
cached; `params()` and `query()` come back normalized (splats split into arrays, values
coerced)
- `ctx.validated` - the validated, typed result per declared target

The parsers matter in [edge middleware](#edge-middleware) and in a
[custom validator](#overriding-validation), where `ctx.validated` is not filled yet.
They are **not** available in `api/app.ts`, which runs before the context is extended -
read the request through Koa's own API there.
[Details&nbsp;›](/backend/context.md)

## Middleware

The full ladder, outermost first:

```
app middleware          <- api/app.ts, every request, matched or not
  edge middleware       <- slot: "edge:*", first in the matched route's chain
    validation          <- params, query, headers, cookies, body
      global middleware <- api/use.ts
        cascading use.ts
          route use()
            handler
```

### Route-level `use`

```ts [api/example/index.ts]
// Koa: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    // runs for both GET and POST
    return next();
  }),

  GET(async (ctx) => { /* ... */ }),
  POST(async (ctx) => { /* ... */ }),
]);
```

Middleware must call `next()` to pass control; skipping it short-circuits the chain.
Execution follows the onion model - definition order going in, reverse order unwinding
after the handler. All `use` calls run before method handlers **regardless of where they
appear in the array**; to run code after the handler, put it after `await next()`.

Restrict middleware to specific methods with `on`:

<!--@include: @/parts/backend/middleware/method-specific.md#koa-->

### Global middleware - `api/use.ts`

Whatever `api/use.ts` default-exports runs for **every route** in the folder -
no imports, no registration:

<!--@include: @/parts/backend/middleware/global.md#koa-->

State goes on `ctx.state`, not on `ctx` itself - properties placed directly on `ctx`
are for the rarer cross-cutting extensions typed via `DefaultContext` (see
[Typing](#typing)). This is the place for work that belongs to routes and wants the
request already validated: loading the current user, permission checks, audit logging.

It is **skipped for non-route responses**: a preflight `OPTIONS`, or a `405`, is
answered before any route chain runs. Which makes it the wrong home for CORS - that
belongs in [app middleware](#app-middleware).

### Cascading `use.ts` and `UseT`

A `use.ts` in any `api/` subfolder wraps that folder and everything beneath it. Parent
middleware always runs before child middleware, and child routes cannot skip a parent
`use.ts`. Every subfolder `use.ts` also exports `UseT` - the type of what the middleware
adds to the context, merged downward so routes underneath are typed automatically:

<!--@include: @/parts/backend/cascading-middleware/context-types.md#koa-->

`ctx.assert(value, status, message)` is Koa's own guard and the idiomatic way to fail
here. Routes underneath then read `ctx.state.user`, fully typed - no imports, no type
arguments. The global `api/use.ts` is the exception: its `UseT` export is ignored;
global types come from `api/env.d.ts` instead. Inner `use.ts` files can extend a
parent's type:

```ts [api/users/account/use.ts]
// Koa: api/users/account/use.ts
import type { UseT as ParentT } from "../use";

export type UseT = ParentT & {
  accountAccess: "read" | "write";
};
```

Keep cascading middleware **generic** - it runs for sibling routes too, so a param like
`id` may be `undefined` there. Parameter-specific logic belongs in the route handler.

Koa's mature middleware ecosystem works unchanged here, wired through `use()`:

<!--@include: @/parts/backend/cascading-middleware/third-party.md#koa-->

### Slots

Slots are named positions in the chain: middleware with the same slot name **replaces**
earlier middleware at that position, keeping the surrounding order. A global default
with a slot can be substituted per subtree or per route; one without a slot always runs
and cannot be overridden - which is what you want for a security check.

```ts [api/use.ts]
// Koa: api/use.ts
export default [
  use(
    async (ctx, next) => { /* global logger */ },
    { slot: "logger" },
  ),
];
```

```ts [api/upload/index.ts]
// Koa: api/upload/index.ts
export default defineRoute<"upload">(({ POST, use }) => [
  use(
    async (ctx, next) => {
      // custom logger for this route only
      return next();
    },
    { slot: "logger" },
  ),
  POST(async (ctx) => { /* ... */ }),
]);
```

Custom slot names are declared in `api/env.d.ts`; `on` does not inherit from the
middleware being replaced, so set it explicitly when overriding:

```ts [api/env.d.ts]
// Koa: api/env.d.ts
export declare module "_/api" {
  interface UseSlots {
    logger: string;
  }
}
```

### Overriding validation

Every validation target sits in a reserved slot - no `UseSlots` declaration needed:
`validate:params`, `validate:query`, `validate:headers`, `validate:cookies`,
`validate:json`, `validate:form`, `validate:raw`, `validate:response`.
Claim one and your middleware runs **instead of** the built-in validator for that
target, and only that target:

```ts [api/import/index.ts]
// Koa: api/import/index.ts
export default defineRoute<"import">(({ POST, use }) => [
  use(async (ctx, next) => {
    // NDJSON - one JSON document per line
    const body = await ctx.bodyparser.raw<string>();
    // ...
    return next();
  }, {
    slot: "validate:json",
  }),

  POST(async (ctx) => {
    // ctx.validated.json is NOT set for an overridden target -
    // the parsers are cached, so asking again costs nothing
    const records = await ctx.bodyparser.raw<string>();
    ctx.body = { imported: records.split("\n").length };
  }),
]);
```

### Edge middleware

Any `use()` entry claiming an `edge:` prefixed slot - in `api/use.ts`, a cascading
`use.ts`, or the route itself - is lifted to run **first in the matched route's chain,
ahead of validation**. That is what turns an expired token into a `401` instead of the
`400 ValidationError` a malformed body would otherwise produce. A slot handler is an
ordinary Koa middleware, so it reads `ctx.headers` and can guard with `ctx.assert`:

<!--@include: @/parts/backend/edge-middleware/edge-slot.md#koa-->

Every `edge:` prefixed name is reserved - nothing to declare. Name one slot per concern
(`edge:auth`, `edge:ratelimit`); they run in declaration order, each independently
overridable. A route can substitute one and leave the others in place:

```ts [api/webhooks/stripe/index.ts]
// Koa: api/webhooks/stripe/index.ts
export default defineRoute<"webhooks/stripe">(({ POST, use }) => [
  use(async (ctx, next) => {
    // this endpoint authenticates by signature, not by bearer token
    await verifyStripeSignature(ctx);
    return next();
  }, {
    slot: "edge:auth",
  }),

  POST(async (ctx) => { /* ... */ }),
]);
```

Two warnings:

- **The bare `edge` slot is not a spare name.** It holds the built-in middleware that
extends the context; claiming it removes `ctx.metaparser`, `ctx.bodyparser` and
`ctx.validated` for everything downstream. Always prefix.
- **Slots cannot replace `api/app.ts`.** If the base check lives in `api/app.ts` and a
route declares `slot: "edge:auth"`, both run and the route authenticates twice, by two
different rules. Pick either one.

Edge middleware is still per route: a request matching no route never reaches it, and
neither do preflights or `405`s. `ctx.validated` is empty here - read through
`ctx.metaparser` / `ctx.bodyparser` instead.

### App middleware

The outermost layer, and the only one KosmoJS doesn't compose. `api/app.ts` hands you
the native Koa instance, so anything Koa can do at app level goes here, written exactly
as Koa's own docs describe:

```ts [api/app.ts]
<!--@include: @/parts/backend/middleware/cors.md#koa-->
```

> **Order matters**: the error handler goes first, or middleware registered before it throws outside its try/catch.

This layer runs first, **on every request, matched or not** - the only place that can answer a 404,
see a preflight `OPTIONS`, or touch a `405`. Which is why CORS belongs here and nowhere else.

`app.use` takes any Koa middleware for it, `@koa/cors` among them.

> This layer runs before the context is extended - no `ctx.validated`, no `ctx.metaparser`, no `ctx.bodyparser`.

### So, where does auth go?

- **Every route authenticates the same way** -> put the check in `api/app.ts` as app
middleware. One middleware, no slots, nothing downstream can replace it by accident,
and it also covers unmatched URLs, preflights and `405`s:

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

- **Some routes authenticate differently** - a signature-verifying webhook, a public
health check -> use an `edge:` slot in `api/use.ts`. You keep the 401-before-400
ordering, and any route or subtree can substitute its own check.

If unsure, start in `api/app.ts`. Moving to a slot later is mechanical - the same
handler, wrapped in `use()`. Moving the other way is not: every route-level `edge:*`
override stops overriding anything and starts running in addition.

## Error handling

### The default handler - `api/errors.ts`

On Koa the error handler is a **middleware**, not a hook - it wraps `await next()` in a
`try`/`catch` and sets `ctx.status` / `ctx.body` when something throws. Hono uses
`app.onError()` and H3 uses `app.use(onError(...))`; copying either onto Koa leaves
errors unhandled:

<!--@include: @/parts/backend/error-handling/default-handler.md#koa-->

It is a regular file you own - customize it freely, then it is registered **first** in
`api/app.ts` via `app.use(defaultErrorHandler)`, so everything registered after it runs
inside its try/catch.

A `ValidationError` exposes `target` (which request part failed), `errors`
(an array of `{ keyword, path, message, params, code }` entries), `errorMessage`,
`errorSummary`, `route` and `data`. Field-level form responses map `error.errors` to
`{ path, message }` pairs; nested paths use arrow notation
(`customer -> address -> city`).

### Throwing from handlers

Don't wrap handler logic in `try`/`catch` just to turn a failure into a response -
throw, and let `api/errors.ts` decide:

<!--@include: @/parts/backend/error-handling/let-handlers-fail.md#koa-->

The default handler understands several shapes:

- `HTTPError` from `@kosmojs/core/errors` - takes a single `[status, message]` **tuple**,
not two arguments
- Koa's own `ctx.assert(value, status, message)` and `ctx.throw(status, message)` -
their errors carry `statusCode` and land in the last branch
- a bare `[status, message]` tuple
- `ValidationError` - thrown for you by the validation layer, answered with a 400
- anything else - `error.statusCode || 500`

Catch inside a handler only when you intend to recover, then re-throw what you can't
handle. A per-route `catch` costs three things: the response shape drifts, central
logging never sees the failure, and a `ValidationError` loses its structured detail.
The same rule holds in middleware - wrapping `await next()` in `try`/`catch` swallows
errors for everything downstream.

## Dev hooks - `api/dev.ts`

`api/dev.ts` wires the API side of the dev server and is re-evaluated on every relevant
change. Koa is Node-native, so the default `requestHandler` hands back `app.callback()`,
the Node request listener:

<!--@include: @/parts/dev-build-run/development-workflow/request-handler.md#koa-->

Two more hooks sit on the same cycle:

- **`requestMatcher(req)`** - decides which requests go to the API instead of Vite.
Default: URL starts with `backend.base` or matches an alias. Override for custom
heuristics (`req.headers["x-api-request"] === "true"`).
- **`teardownHandler()`** - runs **before every reload**. Close DB connections and
sockets here or they leak across restarts; frequent rebuilds during active development
can exhaust a connection pool otherwise.

The backend has no HMR: on change the API program restarts as a whole, and module-level
state resets - by design, since a backend should be stateless. Keep persistent state in
a real store.

### Inspecting routes

Pass `debug` to `appFactory` in `api/app.ts` to print each route's path, methods,
middleware chain (by slot) and handler on startup:

```ts [api/app.ts]
// Koa: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(
  routes,
  { debug: true },
  ({ app }) => {
    app.use(defaultErrorHandler);
  },
);
```

`debug` also takes `"headline"` / `"methods"` / `"middleware"` / `"handler"` for
targeted output, or a function `debug(log, route)` for a custom logger. Named middleware
functions print by name; anonymous ones print their first line - name them.

## Routing syntax support on Koa

Koa is the fully-supported backend - the reason to pick it when routes get exotic:

- **The three plain syntaxes** - `[id]` required, `{id}` optional, `{...path}` splat -
work everywhere, Koa included.
- **Mixed segments** (`files/[name].[ext]`, `v[major].[minor]`) - **full** support,
the only backend where every mixed form works.
- **Power syntax** (raw `path-to-regexp v8` patterns like `book{-:id}-info`) - **full**
support with correctly named params, again Koa-only.

[Parameter&nbsp;details&nbsp;›](/routing/params.md) ·
[Support&nbsp;matrix&nbsp;›](/essentials/frameworks.md)

## Build and deployment

`pnpm build` bundles the backend into `dist/<folder>/api/` as ESM with sourcemaps -
two entry points; pass folder names to build a subset:

```txt
dist/<folder>/api/
├── app.js       -> the Koa app instance, for custom mounting
└── server.js    -> ready-to-run API server
```

The simplest deployments:

```sh
node dist/<folder>/api/server.js -p 4556     # this folder's API alone
node dist/run.js -p 4556                     # every folder, one process
```

Both are `node:http`, so `bun dist/run.js -p 4556` and `deno run -A dist/run.js -p 4556`
work unchanged, and Unix sockets are supported with `-s /tmp/app.sock`.

For more control, mount the app factory yourself. `app.callback()` is a Node.js
`(IncomingMessage, ServerResponse)` handler - Deno and Bun run it via their `node:http`
compat layer, **not** via their native serve APIs, and there is no fetch handler to
hand to edge runtimes:

```js
// Koa: mounting app.js on Node / Bun / Deno
import { createServer } from "node:http";

import app from "./dist/front/api/app.js";

createServer(app.callback()).listen(3000);
```

```js
// Koa: mounting app.js with app.listen, Node only
import app from "./dist/front/api/app.js";

app.listen(3000);
```

If the folder also has an SSR frontend, the SSR bundle already **includes** this API and
serves it on the same port - deploy `dist/<folder>/ssr/server.js` alone, not the API
server beside it. Verify production behavior locally with
[kosmo preview](/dev-build-run/production-preview.md); background processes belong in a
[sidecar folder](/sidecar/intro.md), never mixed into the API process.

## Typing

### Global context types - `api/env.d.ts`

Koa has two surfaces, so there are two interfaces to augment - `DefaultState` for
`ctx.state`, `DefaultContext` for things placed on `ctx` itself:

<!--@include: @/parts/backend/type-safety/env-types.md#koa-->

Declaring types does not set the values - the middleware that populates them still has
to run, usually in `api/use.ts` via `ctx.state.permissions = ...`.

### Per-route type arguments

A single route widens its own context through `defineRoute`'s type parameters.
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
    ctx.body = { id };
  }),
]);
```

If the same properties appear across many routes, move them to `api/env.d.ts` instead.

## Route templates

`backend.templates` seeds new route files by route-name pattern - the first matching
pattern wins, in written order, `*` matching one level and `**` any depth. Templates
fill **blank files only**; existing content is never overwritten. The template is a
string (rendered with Handlebars against `{ route }`) or a function of the route, and
it has to be written in Koa's idiom:

```ts [kosmo.config.ts]
// Koa: kosmo.config.ts
const crudTemplate = `
import { defineRoute } from "_/api";
import type { Resource, ResourcePayload } from "./types";

export default defineRoute<"{{route.name}}">(({ GET, POST }) => [
  GET<{
    query: { page?: number; limit?: number },
    response: [200, "json", Array<Resource>],
  }>(async (ctx) => {
    // list - assign to ctx.body, never return the value
    ctx.body = [];
  }),

  POST<{
    json: ResourcePayload,
    response: [201, "json", Resource],
  }>(async (ctx) => {
    // create
    ctx.status = 201;
    ctx.body = {} as Resource;
  }),
]);`;

export default defineConfig({
  backend: {
    stack: "koa",
    base: "/api",
    templates: {
      "admin/**": crudTemplate,
    },
  },
});
```

<code v-pre>{{route.name}}</code> is substituted per route, which is what keeps the
required route-name type argument correct in seeded files. Integer-like pattern keys
(`"2024/**"`) are hoisted by JavaScript object ordering - prefix with `./` to keep your
written order.

## Worth knowing

- **Create route files empty and let KosmoJS seed them** - seeding writes the current
boilerplate, imports and type arguments included, with nothing left to recall wrong.
In containers and CI, where file watchers can behave clunky, create the empty files
and run the build - it resolves routes with the same code, deterministically.
- Respond by assigning `ctx.body` - a returned value is ignored on Koa.
- State goes on `ctx.state`; `ctx` itself carries only the cross-cutting extensions
you type via `DefaultContext`.
- App middleware in `api/app.ts` runs before the context is extended - no
`ctx.validated`, no parsers there - and the error handler is registered first.
- `ctx.assert(value, status, message)` and `ctx.throw(status, message)` are Koa's own
guards; the default handler maps their errors via `statusCode`. KosmoJS's `HTTPError`
takes a `[status, message]` tuple.
- Koa is the only backend with complete mixed-segment **and** power-syntax support.
- `app.callback()` is a Node request listener - no native Deno or Bun serve, no edge
runtimes; wrap it in `createServer()`.
- The typed fetch clients, `path`/`href` utilities and client-side validation are
backend-agnostic: [fetch clients&nbsp;›](/fetch/intro.md) ·
[usage&nbsp;›](/fetch/start.md) · [client&nbsp;validation&nbsp;›](/fetch/validation.md) ·
[isomorphic&nbsp;transport&nbsp;›](/fetch/isomorphic-clients.md)
