---
title: API Server
description: KosmoJS API layer supports both Koa and Hono frameworks with elegant middleware composition,
    end-to-end type safety, and flexible route definitions inspired by Sinatra framework.
head:
  - - meta
    - name: keywords
      content: koa api, hono api, middleware composition, type-safe api, sinatra-style routing,
        framework choice, typescript api, defineRoute, api middleware
---

`KosmoJS`'s API layer supports two frameworks: [Koa](https://koajs.com/) and [Hono](https://hono.dev/).

**Koa** - battle-tested, mature ecosystem, elegant async/await middleware, Node.js-focused.

**Hono** - exceptional performance, runs on Node.js, Deno, Bun, Cloudflare Workers, and other edge platforms unchanged.

Route organization, middleware patterns, and validation are identical between the two.
The difference is the context API inside handlers - each framework has its own.

## 🔧 Defining Endpoints

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
export default defineRoute(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => { /* retrieve */ }),
  POST(async (ctx) => { /* create */ }),
  PUT(async (ctx) => { /* update */ }),
  DELETE(async (ctx) => { /* delete */ }),
]);
```

Handler order doesn't matter - requests are dispatched by HTTP method.
Undefined methods return `405 Method Not Allowed` automatically.

Available builders: `HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

## 🛡️ Type Safety

Parameters, payloads, and responses are all typed through `TypeScript` type arguments -
the same definitions drive both compile-time checking and runtime validation.
No separate schema language, no DSL switching.
([Details ➜ ](/api-server/type-safety))

## ▶️ Middleware

The `use` function gives you fine-grained middleware control at the route level,
complementing global and cascading middleware.
([Details ➜ ](/api-server/middleware))

`KosmoJS`'s HTTP method mapper draws inspiration from [Sinatra](https://sinatrarb.com/) -
the Ruby framework that pioneered this minimalist routing style back in 2007.
