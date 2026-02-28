---
title: Enhanced Context Object
description: Learn about KosmoJS's enhanced context with unified bodyparser API
    and ctx.validated for type-safe validated data access
head:
  - - meta
    - name: keywords
      content: koa context, hono context, ctx.validated, typed parameters,
        request body parsing, koa bodyparser, hono bodyparser
---

### 🔧 The Enhanced Context Object

`KosmoJS` extends the standard Koa/Hono context with two key enhancements:
a unified bodyparser API and `ctx.validated` for accessing validated data.

## Unified Bodyparser API

While Koa and Hono each have their own approach to parsing request bodies,
`KosmoJS` provides a unified `ctx.bodyparser` interface that works seamlessly across both frameworks.

This abstraction serves two purposes: it provides a consistent API
regardless of which framework you choose, and it enables the validation system to work transparently.

Available parsers:

```ts
await ctx.bodyparser.json()       // Parse JSON request body
await ctx.bodyparser.form()       // Parse URL-encoded form data
await ctx.bodyparser.raw()        // Get raw body buffer
```

The bodyparser automatically caches results, so calling the same parser multiple times
returns the cached data instead of re-parsing the request body.

## Validated Data Access

The `ctx.validated` object provides type-safe access to validated request data.
When you define validation schemas in your route handlers, validated data becomes available here:

```ts
export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<User>,
  }>(async (ctx) => {
    // ctx.validated.json is fully validated as Payload<User>
    const { name, email } = ctx.validated.json;
  }),
]);
```

Under the hood, `KosmoJS` runs validation middleware that:
1. Calls the appropriate bodyparser method (e.g., `await ctx.bodyparser.json()`)
2. Validates the parsed data against your schema
3. Places the validated result in `ctx.validated.json`

The same pattern works for other validation targets:

```ts
export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<CreateUser>,
    query: { limit: number },
    headers: { "x-api-key": string },
  }>(async (ctx) => {
    const user = ctx.validated.json;      // Validated JSON body
    const limit = ctx.validated.query;    // Validated query params
    const apiKey = ctx.validated.headers; // Validated headers
  }),
]);
```

## Route Parameters

The `ctx.validated.params` property gives you access to route parameters
with full TypeScript type information.

When you specify parameter constraints (like numbers or string unions),
these types flow through automatically:

```ts [api/users/:id/index.ts]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute<[
  number // validate id param as number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    // id is a validated number
    const { id } = ctx.validated.params;
  }),
]);
```

This is similar to the standard Koa's `ctx.params` and Hono's `ctx.req.param()`,
but with the benefit of type refinement and runtime validation based on your route's parameter definitions.

## Example: Complete Request Handling

```ts
export default defineRoute(({ POST, GET }) => [
  GET<{
    query: { page: number; filter?: string },
  }>(async (ctx) => {
    // Validated query parameters
    const { page, filter } = ctx.validated.query;
  }),

  POST<{
    json: Payload<User>,
    headers: { "content-type": "application/json" },
  }>(async (ctx) => {
    // Validated JSON body and headers
    const user = ctx.validated.json;
    const contentType = ctx.validated.headers["content-type"];
  }),
]);
```

The validation happens automatically before your handler runs,
so `ctx.validated` always contains properly typed, validated data.
