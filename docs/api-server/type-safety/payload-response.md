---
title: Type Safety - Payload and Response
description: Type request payloads and response bodies in KosmoJS API handlers
    with automatic runtime validation. Ensure handlers receive expected data
    and return properly structured responses.
head:
  - - meta
    - name: keywords
      content: request validation, response typing, payload validation, ctx.body typing,
        api contract, runtime validation, typescript validation, type-safe api
---

Beyond route parameters and context properties,
you can also type the request payload and response body for each HTTP method handler.

This ensures that your handlers receive the data they expect and return properly structured responses.

Method handlers (GET, POST, PUT, etc.) are generic functions that accept optional type arguments.

Use first type argument to define expected payload/response schemas.

```ts [api/example/index.ts]
import { defineRoute } from "_/front/api/users";
import type { User } from "@/front/types";

export default defineRoute(({ POST }) => [
  POST<{
    json: { name: string; email: string; status?: string },
    response: [200, "json", User],
  }>(async (ctx) => {
    // ctx.validated.json is typed as { name: string; email: string; status?: string }
    const { name, email, status } = ctx.validated.json;

    const user = await createUser({ name, email, status });

    // response body must be set to a User object
    ctx.body = user; // for Koa
    ctx.json(body) = user; // for Hono
  }),
]);
```

When you provide these types, `TypeScript` enforces them throughout your handler.
You get autocomplete on `ctx.validated` properties,
and `TypeScript` verifies that you assign correct response body.

Like parameter refinement, these types aren't just compile-time checks.
`KosmoJS` validates the incoming payload against your specified type at runtime
and validates the outgoing response as well.
([Details ➜ ](/validation/payload)).

If validation fails, `KosmoJS` handles the error appropriately without your handler code running.
