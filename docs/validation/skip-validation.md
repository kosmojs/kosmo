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

There are cases where you want `TypeScript` type checking without the runtime validation overhead -
rapid iteration on payload structures, or trusted internal endpoints where you control both sides.

The second type argument to your handler accepts per-target options.
Set `runtimeValidation: false` to keep compile-time types while skipping runtime checks for that target:

```ts [api/example/index.ts]
export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<User>,
  },
  {
    json: {
      runtimeValidation: false, // [!code hl]
    }
  }>(async (ctx) => {
    // ctx.validated.json is not available - use the bodyparser directly
    // Koa:  await ctx.bodyparser.json<User>()
    // Hono: await ctx.req.json<User>()
  }),
]);
```

This works for both payload and response targets. Route parameter validation cannot be skipped -
parameters are part of the URL structure and always validated.

Use this sparingly. Runtime validation is what catches the bugs `TypeScript` can't -
mismatched database responses, unexpected client payloads, API drift.
Skipping it is a conscious tradeoff, not a default.
