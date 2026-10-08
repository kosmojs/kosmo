---
title: Backend Routing
description: >-
    How API routes are resolved in KosmoJS - folders become URLs, method builders become endpoints,
    and the route name ties a handler to its generated types.
    Params, dispatch, 405 and HEAD semantics, aliases and per-framework routing support for Hono, H3 and Koa.
head:
  - - meta
    - name: keywords
      content: hono routing, h3 routing, koa routing, required params, optional params, splat params,
            aliases, cascading middleware, native routing
---

On the backend, a route is more than a URL. It is a URL **plus the set of HTTP methods it answers**,
plus the middleware inherited from the folders above it,
plus the types it drives the validation, fetch clients and OpenAPI spec from.

KosmoJS derives all four from one place: the folder an `index.ts` lives in.

This page covers the backend specifics. The shared fundamentals are in
<span class="text-nowrap">[Directory-Based Routing](/routing/intro)</span>,
and the parameter syntax is in [Parameters](/routing/params).
For how pages are routed, see <span class="text-nowrap">[Frontend Routing](/frontend/routing)</span>.

## One folder, one URL

```txt
api/
├── index/
│   └── index.ts              ->  /api
├── users/
│   ├── index.ts              ->  /api/users
│   ├── use.ts                ->  middleware for /api/users and below
│   ├── types.ts              ->  helper, not a route
│   └── [id]/
│       ├── index.ts          ->  /api/users/:id
│       └── {action}/
│           └── index.ts      ->  /api/users/:id/:action
└── docs/
    └── {...path}/
        └── index.ts          ->  /api/docs/*
```

Only two filenames carry meaning inside `api/`:

| File | Role |
|---|---|
| `index.ts` | Defines the route. Its folder path is the URL. |
| `use.ts` | [Cascading middleware](/backend/cascading-middleware) for this folder and everything beneath it. |

Everything else in a route folder - schemas, queries, tests, fixtures - is yours.
<span class="text-nowrap">It is never scanned</span> and never mistaken for a route,
which is the practical payoff of <span class="text-nowrap">[folder-per-route](/routing/rationale)</span> over file-per-route.

## The URL prefix

The folder path is only half of the URL. The other half is `backend.base` from the source folder's config:

```txt
API route URL = join(backend.base, routeName)
```

```ts [kosmo.config.ts]
export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
  },
});
```

The `api/` directory on disk never appears in the URL - it only separates server routes from `pages/`.
`backend.base` is a **full path**, independent of `frontend.base`, so nothing forces the two to nest.
[Details&nbsp;›](/backend/intro.md#where-routes-end-up-frontend-base-and-backend-base)

When several source folders share one server, requests are dispatched by prefix - longest first,
with a folder's `backend.base` ranked ahead of its `frontend.base`.
<span class="text-nowrap">A request for `/admin/api/users`</span> reaches the admin API
even though `/admin` also matches the admin pages.

## Routes are method tables

A route file default-exports `defineRoute(...)`. Its callback receives one builder per HTTP method
and returns the handlers the route answers:

```ts [api/users/index.ts]
import { defineRoute } from "_/api";

export default defineRoute<"users">(({ GET, POST }) => [
  GET(async (ctx) => { /* list */ }),
  POST(async (ctx) => { /* create */ }),
]);
```

Available builders: `HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

Dispatch is by method, so the order of handlers in the array does not matter.
This one file is the whole REST surface of `/api/users` - there is no second file per method
and no router table that has to agree with it.

### What a request can get back before your handler runs

The route, not the handler, decides some responses:

* **Method not defined -> `405 Method Not Allowed`.** Define `GET` and `POST`, and a `DELETE` is rejected for you.
* **`HEAD` falls back to `GET`.** A route with a `GET` handler but no `HEAD` answers HEAD requests
  through the `GET` handler, validated against the same schemas, with the body dropped.
  Define `HEAD` explicitly only to override that.
  Hono is the exception: its router ignores a `HEAD` handler, so the `GET` fallback always wins there.
* **No route matched -> your framework's 404.** Only [`api/app.ts`](/backend/middleware.md#app-middleware)
  sees these requests, along with preflights and `405`s. Route-level and global middleware never do,
  which is why CORS lives there.

## The route name

`defineRoute<"users/[id]">` restates the path the file already lives at.
The URL does not need it - TypeScript does, because it cannot see the file system.

The name is the route's key into the derived `RouteMap`,
and that lookup is what types `ctx.validated.params`
and the merged context of every [use.ts](/backend/cascading-middleware.md#type-safe-context-extension) above the route.

The rule is mechanical: the path relative to `api/`, without the trailing `index.ts`.

| File | Route name |
|---|---|
| `api/index/index.ts` | `"index"` |
| `api/users/index.ts` | `"users"` |
| `api/users/[id]/index.ts` | `"users/[id]"` |
| `api/docs/{...path}/index.ts` | `"docs/{...path}"` |

You never type it by hand: the seeded boilerplate contains the correct name.
It also cannot drift - a name that matches no real route is a compile error,
so renaming `api/users/` to `api/people/` flags every stale `defineRoute<"users/...">` at once.

[Details&nbsp;›](/backend/intro.md#the-route-name-type-argument)

## Parameters

The three syntaxes - required `[id]`, optional `{id}`, splat `{...path}` - behave identically on every backend.
What is specific to the backend is what your handler receives.

| Syntax | `ctx.validated.params` |
|---|---|
| `[id]` | the segment, always present |
| `{id}` | the segment, or `undefined` when absent |
| `{...path}` | an array of segments |

Parameters arrive **validated**, not raw. Refine them with a tuple, one position per parameter,
<span class="text-nowrap">in path order</span>:

```ts [api/users/[id]/{action}/index.ts]
type UserAction = "retrieve" | "update" | "delete";

export default defineRoute<"users/[id]/{action}", [
  number,      // id [!code hl:2]
  UserAction,  // action
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id, action } = ctx.validated.params; // number, UserAction | undefined
  }),
]);
```

A request that fails the refinement is rejected before your handler runs.
[Details&nbsp;›](/validation/params)

:::info Keep the tuple brackets inline
The `[]` of the params tuple must be written in the `defineRoute` type arguments.
Aliases *inside* the brackets are fine; hiding the brackets behind a type alias makes the
tuple unreadable and every request is rejected.
[Details&nbsp;›](/validation/refine.md#keep-the-wrapping-brackets-literal)
:::

The raw, untouched params still exist on the framework's own context:

::: code-group

```ts [Hono]
ctx.req.param()
```

```ts [H3]
event.context.params
```

```ts [Koa]
ctx.params
```

:::

### One handler for list and detail

An optional parameter lets a single route serve both the collection and the item:

```ts [api/users/{id}/index.ts]
export default defineRoute<"users/{id}", [number]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    if (id === undefined) {
      // GET /api/users - list
    } else {
      // GET /api/users/123 - detail
    }
  }),
]);
```

When the two cases have different methods, payloads or middleware, prefer two routes -
`users/index.ts` and `users/[id]/index.ts` - so each gets its own methods and its own types.

### Matching rules

* **Static beats dynamic.** `users/me` wins over `users/[id]` for `/api/users/me`, whatever the file order.
* **Optional parameters must not be followed by required ones.**
  `users/{section}/{subsection}` is fine; `users/{optional}/[required]` is not.
* **An optional segment before a static one can swallow it.**
  With `properties/{city}/filters`, the URL `/api/properties/filters` binds `{city}` to `"filters"`,
  then looks for a second `filters` segment and 404s. Add an explicit static sibling
  (`properties/filters/index.ts`) and static priority resolves it.

[Details&nbsp;›](/routing/params.md#watch-out-for-ambiguous-paths)

## Mixed segments and power syntax

Backends can express URLs that frontend routers mostly cannot - file extensions, composite segments:

```txt
files/[name].[ext]          ->  /api/files/report.pdf
profiles/[id]-[data].json   ->  /api/profiles/1-posts.json
```

Any parameter name containing non-alphanumeric characters is passed through as a raw
<span class="text-nowrap">`path-to-regexp v8` pattern</span> -
the [power&nbsp;syntax](/routing/params.md#power-syntax):

```txt
api/{v:version}/users       ->  /api/users or /api/v2/users
```

Support differs per backend, and this is the one place the stack choice changes your routes:

| | Hono | H3 | Koa |
|---|---|---|---|
| `[id]`, `{id}`, `{...path}` | ✅ | ✅ | ✅ |
| Mixed segments | ⚠️ partial | ⚠️ partial | ✅ full |
| Power syntax | ⚠️ matches, params renamed `_0abc` | ❌ won't match | ✅ full |

:::info A practical rule
Mixed segments are workable on all three backends; reach for power syntax only on Koa.
If a route silently 404s, check the [support&nbsp;matrix](/essentials/frameworks.md#routing-syntax-support)
before debugging the handler.
:::

## Routes inherit from their folders

The folder hierarchy that builds the URL also builds the middleware chain.
A request to `/api/users/account` runs, in order:

```txt
api/app.ts                       app middleware - every request, matched or not
  edge:* middleware              first in the matched route's chain, before validation
    validation                   params, query, headers, cookies, body
      api/use.ts                 global
        api/users/use.ts         parent folder
          api/users/[id]/use.ts  current folder
            route use()          inline, inside defineRoute
              handler
```

Parent middleware always runs before child middleware, and a child cannot skip its parents.
Moving a route folder moves the middleware it inherits with it - the structure is the wiring.

Because a cascading `use.ts` also runs for sibling routes, keep it generic:
a param like `id` may be `undefined` there.

[Details&nbsp;›](/backend/cascading-middleware.md#parameter-availability)

## Aliases

A route's URL comes from its folder, which keeps URLs predictable.
When an outside consumer needs a different one - `/feed.xml`, `/healthz`, a legacy path -
`backend.alias` serves an existing route at an additional URL:

```ts [kosmo.config.ts]
backend: {
  stack: "hono",
  base: "/api",
  alias: {
    "/feed.xml": "rss",
    "/members/[id]": "users/[id]",
  },
}
```

The key is the whole path - it is **not** prefixed by `backend.base`.
The value is the route name.

An alias is another entry for the same handler, not a redirect,
so the route's middleware and validation come along unchanged.

When the alias carries parameters, they must match the target's by name and kind;
a mismatch is not a startup error, the request just 404s.

[Details&nbsp;›](/backend/aliases)

## Native routing, nothing in between

Routing is overall native, `path-to-regexp` is used only at build time,
to turn your directory structure into route definitions.

At runtime those routes are registered with your framework's own router - Hono's, H3's or Koa's -
exactly as you would have registered them by hand.

**No KosmoJS router sits between a request and the framework's matching logic.**

```txt
build time                          runtime
──────────                          ───────
api/users/[id]/index.ts      ->     Hono / H3 / Koa router
        │
        └── parsed via path-to-regexp
```

Everything the framework documents about its router - matching order, `OPTIONS` handling,
error propagation - applies as written.

**KosmoJS is the chassis; the framework is the engine.**

## Inspecting what was registered

While you work, the dev server prints the prefix table - which source folder owns which path -
so a route landing somewhere unexpected is usually visible there.

To list the registered API routes, pass `debug` to `appFactory` in `api/app.ts`:

```ts [api/app.ts]
export default appFactory(
  routes,
  { debug: true },
  ({ app }) => {
    // ...
  },
);
```

[Details&nbsp;›](/dev-build-run/development-workflow.md#inspecting-api-routes)

## Quick reference

| You want | You write |
|---|---|
| An endpoint at `/api/orders` | `api/orders/index.ts` |
| The base route `/api` | `api/index/index.ts` |
| A required / optional / catch-all segment | `[id]` / `{id}` / `{...path}` |
| Several methods on one URL | Several handlers in one `defineRoute` |
| A typed, validated param | A tuple as the second type argument |
| Auth for a whole section | A `use.ts` in that section's folder |
| A second public URL for a route | An entry in `backend.alias` |
| A helper next to a route | Any file other than `index.ts` / `use.ts` |
