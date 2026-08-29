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

Supported backend frameworks:
- [Hono](https://hono.dev) - exceptional performance, runs on Node/Deno/Bun/edge platforms unchanged.
- [H3](https://h3.dev) - similar to Hono in performance and multi‑runtime support, focus on Web standards.
- [Koa](https://koajs.com) - battle-tested, mature ecosystem, elegant async/await middleware, Node-focused.

Route organization, middleware composition, and validation are identical between frameworks.
The difference is the context API inside handlers - each framework has its own.

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

Handler order doesn't matter - requests are dispatched by HTTP method.
Undefined methods return `405 Method Not Allowed` automatically.

Available builders: `HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

This method-based routing style draws inspiration from [Sinatra](https://sinatrarb.com/) -
the Ruby framework that pioneered it back in 2007.

## The Route Name Type Argument

`defineRoute<"users/[id]">` restates the path the file already lives at, which looks redundant.

It isn't - and it's worth one minute to understand why, because it explains a lot of what follows.

The routing itself never needs it. The URL comes from the file's location, full stop.
The string is there for **TypeScript**, which cannot see the file system.

Everything `KosmoJS` knows about a route is generated into a `RouteMap` in `lib/`, keyed by route name:

```ts [lib/front/@api/routes.ts - generated]
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

In practice, you don't: the [generated boilerplate](/routing/generated-content#api-routes) already contains the correct name.

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

## Where the URL Comes From

A route's final URL is three parts joined:

```
<base>  +  <apiBase>  +  <route name>

  /        /api          users/[id]      ➜  /api/users/:id
  /admin   /api          users/[id]      ➜  /admin/api/users/:id
```

- **`base`** is the source folder's base URL, set in its `kosmo.config.ts`.
- **`apiBase`** defaults to `/api` and is configurable per folder.
- The `api/` directory name itself never appears in the URL -
it is the folder that separates server routes from `pages/`, not a path segment.

[Details&nbsp;›](/essentials/config#folder-options)

## Type Safety

Parameters, payloads, and responses are all typed through type arguments -
the same definitions drive both compile-time checking and runtime validation.
No separate schema language, no DSL switching.
[Details&nbsp;›](/backend/type-safety)

## Middleware

The `use` function gives you fine-grained middleware control at the route level,
complementing global and cascading middleware.
[Details&nbsp;›](/backend/middleware)
