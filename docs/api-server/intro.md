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

`KosmoJS`'s API layer gives you the freedom to choose between two state-of-the-art frameworks:
[Koa](https://koajs.com/) and [Hono](https://hono.dev/).

Both share a minimalist philosophy and powerful middleware composition,
but serve different needs - Koa excels in Node.js environments with its mature ecosystem,
while Hono delivers exceptional performance across multiple runtimes including edge environments.

## 🎯 Choose Your Foundation

**Koa** brings battle-tested stability with elegant async/await middleware patterns
and a rich ecosystem of plugins built over years of production use.

**Hono** offers blazing speed and runtime flexibility - deploy the same code to Node.js,
Deno, Bun, Cloudflare Workers, or any edge platform with zero changes.

The best part? Your application code remains identical regardless of which framework you choose.
Switch between them by changing a single configuration setting - your routes, middleware,
and type definitions work exactly the same way.

## 🛡️ Type Safety Throughout

`KosmoJS` extends both frameworks with type safety throughout the request-response cycle.
You define your API contracts in `TypeScript` types - parameters, payloads, responses -
and these types flow through to runtime validation automatically.

There's no context switching between writing schemas in one DSL
and implementing logic in another language.
Everything lives in `TypeScript`, in the same file, maintaining a cohesive development experience.
([Details ➜ ](/api-server/type-safety/params))

## 🔧 Structured Yet Flexible

The `defineRoute` function provides structure for organizing HTTP method handlers
while preserving framework flexibility.

Veterans will recognize the familiar elegance of `KosmoJS`'s HTTP methods mapper,
which draw inspiration from [Sinatra](https://sinatrarb.com/) -
the Ruby framework that pioneered minimalist web development back in 2007.

The `use` function enables fine-grained middleware control at the route level,
complementing global middleware with route-specific behavior.
([Details ➜ ](/api-server/use-middleware/intro))

Context and state extensibility means middleware can augment requests
with authentication details, database connections, or any other request-scoped data,
all with proper `TypeScript` types that flow through your entire handler chain.

This approach creates APIs that are both type-safe and pragmatic -
you get compile-time checking and runtime validation without sacrificing the flexibility
to handle real-world requirements that don't fit neat abstractions.
