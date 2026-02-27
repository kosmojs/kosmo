---
title: Skip Runtime Validation
description: Set runtimeValidation option to false to keep TypeScript type checking
    without runtime validation for gradual adoption, performance optimization, or trusted internal endpoints.
head:
  - - meta
    - name: keywords
      content: skip validation, opt-out validation,
        gradual adoption, performance optimization, type checking only
---

Sometimes you might want `TypeScript` type checking without runtime validation.

`KosmoJS` uses the second type argument for options (that's it, first argument for scheams, second for options).

When `runtimeValidation` option set to false, you keep compile-time checking
while skip runtime validation:

```ts [api/example/index.ts]
export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<User>, // payload won't be validated at runtime
  },
  {
    json: {
      runtimeValidation: false, // [!code hl]
    }
  }>(async (ctx) => {
    // no ctx.validated.json, use `await ctx.bodyparser.json()` for Koa
    // or `await ctx.req.json()` for Hono
  }),
]);
```

In this example, the payload is typed but not validated.
You might use this pattern during development when you're iterating quickly on payload structures
and don't want validation failures interrupting your flow.

Or you might use it for trusted internal endpoints where you control both client
and server and have high confidence in data correctness.

Works for both payload and response.
However, you cannot skip parameter validation.
Route parameters are always validated because they're part of your URL structure and affect routing behavior.

Use with caution. Runtime validation is a powerful tool for ensuring data correctness and catching bugs early.
Skipping validation means giving up these benefits, so you should have a clear reason for doing so.
