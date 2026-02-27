---
title: API Server Endpoints
description: Learn how to build KosmoJS API endpoints using defineRoute with Koa and Hono
head:
  - - meta
    - name: keywords
      content: hono endpoints, koa endpoints, defineRoute, http methods,
        koa context, hono context, rest api, middleware composition
---

API endpoints in `KosmoJS` are built using the `defineRoute` function,
which provides a structured way to handle HTTP methods, apply middleware,
and maintain type safety throughout your request-response cycle.

This system supports both `Koa` and `Hono`, allowing you to choose the API framework
that best fits your needs while maintaining the same routing architecture and type inference.

## ⇆ Basic Endpoint Structure

Every API endpoint must export a route definition as its default export.
You create this definition using the `defineRoute` function,
which accepts a factory function that returns an array of middleware.

The factory function receives a single argument – an object containing HTTP method builders
and the `use` function for custom middleware.

You typically destructure this object to access only the methods you need for that particular endpoint.

```ts [api/users/:id/index.ts]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    // Handle GET requests
  }),
]);
```

This structure gives you a clear, declarative way to define which HTTP methods your endpoint supports.

Both `Koa` and `Hono` handlers receives the context object as first argument,
which `KosmoJS` enhances with additional properties to make common tasks easier.

## ⥃ Working with Multiple HTTP Methods

Many endpoints need to handle multiple HTTP methods.
You define handlers for each method you want to support
by including them in the array returned from your factory function.

```ts [api/users/index.ts]
export default defineRoute(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => {
    // Retrieve resource
  }),

  POST(async (ctx) => {
    // Create resource
  }),

  PUT(async (ctx) => {
    // Update resource
  }),

  DELETE(async (ctx) => {
    // Delete resource
  }),
]);
```

The order in which you list these handlers doesn't matter –
`KosmoJS` routes requests to the appropriate handler based on the HTTP method of the incoming request.

If a request comes in for a method you haven't defined,
`KosmoJS` automatically responds with a 405 Method Not Allowed status.

The available method builders are HEAD, OPTIONS, GET, POST, PUT, PATCH, and DELETE,
covering all the standard HTTP methods you'll typically need in a REST API.
