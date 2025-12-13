---
title: API Server
description: KosmoJS API layer built on Koa with elegant middleware composition, end-to-end type safety, and flexible route definitions inspired by Sinatra framework.
head:
  - - meta
    - name: keywords
      content: koa api, middleware composition, type-safe api, sinatra-style routing, koa context, typescript api, defineRoute, api middleware
---

`KosmoJS`'s API layer is built on [Koa](https://koajs.com/), leveraging its elegant middleware composition model
and powerful context object to create a clean, extensible foundation for API development.

## 🏗️ Built on Koa

Koa's minimalist design provides just enough structure without imposing unnecessary abstractions.
Its async/await approach makes asynchronous code natural to write and reason about,
while the context object provides a clean way to pass request-scoped data through middleware chains.

The middleware composition pattern - where each piece can modify the request,
delegate to the next middleware, and then modify the response on the way back -
creates predictable, testable request handling pipelines.
([Details ➜ ](/api-server/endpoints))

## 🛡️ Type Safety Throughout

`KosmoJS` extends Koa's foundation with type safety throughout the request-response cycle.
You define your API contracts in `TypeScript` types - parameters, payloads, responses -
and these types flow through to runtime validation automatically.

There's no context switching between writing schemas in one DSL
and implementing logic in another language.
Everything lives in `TypeScript`, in the same file, maintaining a cohesive development experience.
([Details ➜ ](/api-server/type-safety/params))

## 🔧 Structured Yet Flexible

The `defineRoute` function provides structure for organizing HTTP method handlers
while preserving Koa's flexibility.

Veterans will recognize the familiar elegance of `KosmoJS`'s HTTP methods mapper,
which draw inspiration from [Sinatra framework](https://sinatrarb.com/) -
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

