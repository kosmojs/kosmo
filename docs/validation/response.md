---
title: Response Validation
description: Validate API responses before sending to clients. Catch bugs where handlers return incomplete objects,
    wrong types, or unexpected structures with automatic runtime checking.
head:
  - - meta
    - name: keywords
      content: response validation, output validation, api contract, response typing,
        data integrity, runtime response check, ValidationError
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

Response validation is especially valuable for data sourced from databases or third-party APIs,
where the shape can change without warning.

Defining a response schema also enables automatic `OpenAPI` generation -
type safety and documentation in one step. ([Details ➜ ](/openapi))
