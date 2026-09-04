---
title: API Server
description: KosmoJS API layer supports Hono, H3 and Koa frameworks, with elegant middleware composition,
    end-to-end type safety, and flexible route definitions inspired by Sinatra framework.
head:
  - - meta
    - name: keywords
      content: hono api, h3 api, koa api, middleware composition, type-safe api, sinatra-style routing,
        framework choice, typescript api, defineRoute, api middleware
---

A source folder's API runs on one backend framework - **Hono**, **H3** or **Koa**.

- [Hono](https://hono.dev) - exceptional performance, runs unchanged on Node, Deno, Bun and edge platforms.
- [H3](https://h3.dev) - comparable performance and reach, built around Web standards.
- [Koa](https://koajs.com) - battle-tested Node ecosystem, elegant async/await middleware.

The decision matters less than it looks.
Route layout, middleware composition, payload validation, fetch clients, all behave identically whichever you pick.

What changes is the context object your handlers receive -
reading a body, setting a response, raising an error stay your framework's own idioms, untouched.

## What's in `api/`

Creating a source folder with a backend seeds a small, fixed set of files.
Each is a real source file you own - they are written once, never re-seeded behind your back,
and none of them can be seeded through [custom templates](/backend/custom-templates#what-it-overrides) (only route files can).

```text
src/<folder>/api/
├── app.ts                -> builds the backend app instance
├── server.ts             -> standalone server entry
├── dev.ts                -> dev-only hooks
├── errors.ts             -> the central error handler
├── use.ts                -> global middleware (every route in this folder)
├── env.d.ts              -> global context/state types, custom slots
│
└── users/                ── a route folder ──
    ├── use.ts            -> middleware for /users and everything under it
    ├── index.ts          -> the route  ➜  /api/users
    ├── types.ts          -> colocated helper, NOT a route
    └── [id]/
        └── index.ts      -> the route  ➜  /api/users/:id
```

### Foundation files

| File | What it is | When&nbsp;you&nbsp;touch&nbsp;it |
|---|---|---|
| `app.ts` | Builds the app with `appFactory()`. The callback hands you the **native** Hono/H3/Koa instance - this is where the error handler is registered and where any framework-native middleware or plugin goes. | Adding native middleware; enabling [debug](/dev-build-run/development-workflow#inspecting-api-routes) |
| `server.ts` | The standalone entry that boots `app.ts` - what `node dist/<folder>/api/server.js` runs in production. | Rarely |
| `dev.ts` | Dev-only hooks: `requestHandler()` returns the handler the dev server dispatches to (override it for WebSockets or custom dispatch), and `teardownHandler()` runs **before every reload** - close DB connections and sockets here or they leak across restarts. | WebSockets; connection cleanup |
| `errors.ts` | The central error handler, registered by `app.ts`. The default distinguishes `ValidationError` and `HTTPError`, then content-negotiates JSON or plain text. | Customizing error responses |
| `use.ts` | [Global middleware](/backend/middleware#global-middleware-api-use-ts) - runs for every route in this folder. | Request id, CORS, logging, auth |
| `env.d.ts` | Module augmentation for folder-wide types: `DefaultVariables`/`DefaultBindings` (Hono), `DefaultContext` (H3), `DefaultState`/`DefaultContext` (Koa), plus [custom slot names](/backend/middleware#slot-composition). | Typing `ctx.state` / bindings |

Only `app.ts` differs between backends, and only in how the error handler attaches:

:::tabs key:backend variant:code
== Hono
```ts
export default appFactory(routes, ({ app }) => {
  app.onError(defaultErrorHandler);
});
```
== H3
```ts
export default appFactory(routes, ({ app }) => {
  app.use(onError(defaultErrorHandler));
});
```
== Koa
```ts
export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);
});
```
:::

### Inside a route folder

| File | What it is |
|---|---|
| `index.ts` | **The route.** Default-exports `defineRoute(...)`; its folder path becomes the URL. |
| `use.ts` | [Cascading middleware](/backend/cascading-middleware) for this folder and everything beneath it. Exports `UseT` to extend the typed context downward. |
| anything&nbsp;else | A colocated helper - schemas, types, queries, tests. Never a route, never scanned. |

`index.ts` and `use.ts` are the only two filenames the backend watcher acts on.
That is the whole convention: **one URL per folder, one file that defines it.**

Derived code - validators, the route table, fetch clients, the OpenAPI spec - never lands here.
It lives in `lib/`, is git-ignored, and you neither read nor edit it.
[Details&nbsp;›](/essentials/why-codegen)

## Defining Endpoints

Every API route exports a `defineRoute` definition as its default export.
The factory function receives HTTP method builders and `use` for middleware,
and returns an array of handlers. Destructure only what you need:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    // handle GET /users/:id
  }),
]);
```

Multiple methods in one route:

```ts [api/users/index.ts]
export default defineRoute<"users">(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => { /* retrieve */ }),
  POST(async (ctx) => { /* create */ }),
  PUT(async (ctx) => { /* update */ }),
  DELETE(async (ctx) => { /* delete */ }),
]);
```

This method-based routing style draws inspiration from [Sinatra](https://sinatrarb.com/) -
the Ruby framework that pioneered it back in 2007.

Handler order doesn't matter - requests are dispatched by HTTP method.
Undefined methods return `405 Method Not Allowed` automatically.

Available builders: `HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

::: tip HEAD is served by your GET handler
`HEAD` is the one exception to the 405 rule. A route that defines `GET` but not `HEAD` still answers HEAD requests:
they are dispatched to the `GET` handler and validated against its schemas,
with the body dropped as the HTTP spec requires.
Define `HEAD` explicitly only when you want to override that.
Hono is the exception: its router ignores any `HEAD` handler you define,
so the fallback to `GET` always wins there.
:::

## The Route Name Type Argument

`defineRoute<"users/[id]">` restates the path the file already lives at, which looks redundant.

It isn't - and it's worth one minute to understand why, because it explains a lot of what follows.

The routing itself never needs it. The URL comes from the file's location, full stop.
The string is there for **TypeScript**, which cannot see the file system.

Everything `KosmoJS` knows about a route is placed into a `RouteMap` in `lib/`, keyed by route name:

```ts [lib/front/@api/routes.ts]
export type RouteMap = {
  "users/[id]": {
    paramsDefaults: [string],           // params, in path order
    paramsMappings: { id: 0 },          // name ➜ position
    cascadingState: UseT_apiUse & UseT_apiUsersUse,  // merged use.ts context
  },
  // ...every other route
};
```

The name is how the handler looks itself up in that map. That single lookup is what gives you:

- **`ctx.validated.params` typed** - which params exist, in what order, refined to what.
- **Cascading context typed** - the merged `UseT` of every `use.ts` above this route,
which is why `ctx.get("user")` is typed without importing anything.
[Details&nbsp;›](/backend/cascading-middleware#type-safe-context-extension)
- **The params refinement tuple checked against the real params** - a tuple longer than
the route has parameters is a compile error.

Because there is no runtime argument carrying it, TypeScript has nothing to infer it from -
so the type argument is **required**, and you write it once when the file is created.

In practice, you don't: the [seeded boilerplate](/routing/seeded-content#api-routes) already contains the correct name.

::: tip What if it's wrong?
It can't silently drift. `defineRoute<R>` is constrained as `R extends keyof RouteMap`,
so a name that doesn't match a real route is a **compile error**, not a runtime surprise.

Rename `api/users/` to `api/people/` and the stale `defineRoute<"users/[id]">` fails to typecheck immediately -
the same refactor-as-a-checklist property the typed [`Link`](/frontend/link-navigation) component gives you on the frontend.
:::

The name is the route path **relative to `api/`**, without the trailing `index.ts` -
so `api/users/[id]/index.ts` is `"users/[id]"`, and `api/index/index.ts` is `"index"`.

Pages have no equivalent: a page component is an ordinary default export,
and its routing is resolved by the framework's own router, so there is nothing to look up.

## Where routes end up: `base` and `apiBase`

Every source folder has a `base`, the URL prefix it owns, and an `apiBase`,
the prefix its API routes get *inside* that base. `apiBase` defaults to `/api`.
The two compose:

```
API route URL  = join(base, apiBase, routeName)
page URL       = join(base, pagePath)
```

`apiBase` is relative to `base`, not to the site root. That is the one thing to hold on to;
everything in the table follows from it.

| `base` | `apiBase` | API routes live at | pages live at | Note |
| --- | --- | --- | --- | --- |
| `/` | default (`/api`) | `/api/<route>` | `/<page>` | the scaffold's default |
| `/admin` | default (`/api`) | `/admin/api/<route>` | `/admin/<page>` | the API moves with the folder |
| `/` | `/hub` | `/hub/<route>` | `/<page>` | any prefix works; it is still joined onto `base` |
| `/api` | default (`/api`) | `/api/api/<route>` | none (API-only folder) | the doubled segment people hit first |
| `/api` | `/` | `/api/<route>` | none | an API-only folder that owns `/api` directly |
| `/webhooks` | `/` | `/webhooks/<route>` | none | the same shape for any public API surface |
| `/docs` or `/` | default | none (no backend generator) | `/docs/<page>` or `/<page>` | `apiBase` is ignored without a backend |

### An API-only folder at its own prefix

To serve an API directly under a prefix, set `apiBase` to `/`:

```ts
// src/api/kosmo.config.ts
export default defineConfig({
  base: "/api",
  apiBase: "/", // [!code hl]
  // ...
});
// src/api/api/emails/index.ts  ->  /api/emails
```

Leaving `apiBase` at its default here would put the same route at `/api/api/emails`.

### How requests are dispatched

The dev server and the built `dist/run.js` route by prefix:
more specific prefixes win, and API prefixes are ranked ahead of page prefixes -
`/admin/api` beats `/admin` and `/api` beats `/`.

A folder at `base: "/"` catches only what no other folder claims.
The server prints the prefix table on start; read it when a route lands somewhere unexpected:

```
  /admin/api   -> admin
  /api/        -> api
  /webhooks/   -> webhooks
  /admin       -> admin
  /            -> docs
```

## Type Safety

Parameters, payloads, and responses are all typed through type arguments -
the same definitions drive both compile-time checking and runtime validation.
No separate schema language, no DSL switching.
[Details&nbsp;›](/backend/type-safety)

## Middleware

The `use` function gives you fine-grained middleware control at the route level,
complementing global and cascading middleware.
[Details&nbsp;›](/backend/middleware)
