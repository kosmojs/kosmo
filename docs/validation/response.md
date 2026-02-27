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

Just as you validate incoming request data, you can validate outgoing response data.

Response validation ensures that your API contract is honored -
that you actually return the data structure your types promise.

This catches bugs where handlers might return incomplete objects, wrong types, or unexpected structures.

Response validation works similarly to payload validation,
just use `response` property to provide response schema, status code, content type and body:

```ts [api/users/index.ts]
import type { User } from "@/front/types/api-payload";
import { defineRoute } from "_/front/api/users";

export default defineRoute(({ GET }) => [
  GET<{
    response: [200, "json", User], // [!code hl]
  }>(async (ctx) => {
    // response must comply to defined schema
  }),
]);
```

Before sending the response to the client,
`KosmoJS` validates that status, content type and body actually matches defined schema.

If validation fails - perhaps because the database returned a user object that's missing the `preferences` field,
or because the `profile.email` doesn't match email format constraints - `KosmoJS` throws a ValidationError
instead of sending invalid data to the client.

This protects your API consumers from receiving malformed data and helps you catch bugs in your handler logic.

Another major benefit of defining response schemas is automatic `OpenAPI` schema generation.
This gives you both type safety and API documentation in one step.
([Details ➜ ](/generators/openapi/intro))
