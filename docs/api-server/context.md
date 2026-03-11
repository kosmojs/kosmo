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

`KosmoJS` extends the standard Koa/Hono context with two additions:
a unified bodyparser API and `ctx.validated` for type-safe access to validated request data.

## 🔋 Unified Bodyparser

`ctx.bodyparser` works the same regardless of framework:

```ts
await ctx.bodyparser.json()   // JSON request body
await ctx.bodyparser.form()   // URL-encoded or multipart form
await ctx.bodyparser.raw()    // raw body buffer
```

Results are cached - calling the same parser multiple times doesn't re-parse the request.

In practice you rarely call this directly. Define a validation schema in your handler
and the appropriate parser runs automatically, placing the result in `ctx.validated`.

## ☔ Validated Data Access

`ctx.validated` holds the validated, typed result for each target you defined:

```ts
export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<CreateUser>,
    query: { limit: number },
    headers: { "x-api-key": string },
  }>(async (ctx) => {
    const user = ctx.validated.json;      // validated JSON body
    const limit = ctx.validated.query;    // validated query params
    const apiKey = ctx.validated.headers; // validated headers
  }),
]);
```

## 🔗 Route Parameters

Validated params are available at `ctx.validated.params`, typed according to your refinements:

```ts [api/users/[id]/index.ts]
export default defineRoute<"users/[id]", [number]>(({ GET, POST }) => [
  GET<{
    query: { page: string; filter?: string },
  }>(async (ctx) => {
    const { id } = ctx.validated.params;    // number
    const { page, filter } = ctx.validated.query;
  }),

  POST<{
    json: Payload<User>,
  }>(async (ctx) => {
    const { id } = ctx.validated.params;    // number
    const user = ctx.validated.json;
  }),
]);
```

The underlying `ctx.params` (Koa) and `ctx.req.param()` (Hono) still exist if you need the raw strings.
