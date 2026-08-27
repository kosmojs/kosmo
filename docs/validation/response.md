---
title: Response Validation
description: Validate API responses before sending to clients. Catch bugs where handlers return incomplete objects,
    wrong types, or unexpected structures. Enabled by default in development; opt in per handler for production.
head:
  - - meta
    - name: keywords
      content: response validation, output validation, api contract, response typing,
        data integrity, runtime response check, ValidationError, runtimeValidation, production
---

Outgoing responses can be validated too. Use the `response` property to declare the expected status code,
content type, and body schema:

```ts [api/users/index.ts]
import type { User } from "~/types/api-payload";
import { defineRoute } from "_/api";

export default defineRoute<"users">(({ GET }) => [
  GET<{
    response: [200, "json", User], // [!code hl]
  }>(async (ctx) => {
    // response must comply with the defined schema
  }),
]);
```

Before sending, `KosmoJS` checks that the actual status, content type, and body match the schema.
If anything is off - a missing field, a type mismatch, a constraint violation - it throws a `ValidationError`
instead of sending malformed data to the client.

## Development vs Production

Response validation is environment-aware:

- **Development / test**: every declared response schema is validated at runtime.
Opt out per handler with [`runtimeValidation: false`](/validation/skip-validation).
- **Production builds**: response validation is **disabled by default**.
To enable it running in production, set `runtimeValidation: true` on the response target:

```ts [api/users/index.ts]
export default defineRoute<"users">(({ GET }) => [
  GET<{
    response: [200, "json", User],
  },
  {
    response: { // [!code ++:3] validate this response in production too
      runtimeValidation: true,
    }
  }>(async (ctx) => {
    // ...
  }),
]);
```

There is no global switch - each handler enables production response validation for itself.
This is deliberate: validating every outgoing response costs CPU on your hottest path,
so production validation is a per-endpoint decision, not a blanket default.

Note the asymmetry with request validation: payloads and parameters coming *into* your API are always validated,
in every environment (unless explicitly skipped) - they cross a trust boundary.
Responses are produced by your own code, so by default they are checked only where bugs are cheap: in development.

Response validation is especially valuable for data sourced from databases or third-party APIs,
where the shape can change without warning. If an endpoint serves such data and malformed output
would be worse than a thrown error, that endpoint is a candidate for `runtimeValidation: true`.

Defining a response schema also enables automatic `OpenAPI` generation -
type safety and documentation in one step.
[Details ›](/openapi)
