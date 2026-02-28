---
title: Payload Validation
description: Validate request payloads with inline TypeScript types or imported type definitions.
    Support for nested structures, conditional validation, generics, and complex domain models with TRefine constraints.
head:
  - - meta
    - name: keywords
      content: payload validation, request validation, nested types, conditional validation,
        union types, generic types, json validation, form validation, TRefine
---

Request payloads are the data your API receives from clients -
including query parameters, headers, cookies for any request method,
and request bodies for POST/PUT/PATCH requests.

These payloads often have complex nested structures with multiple fields,
each requiring specific validation rules to ensure data integrity.

`KosmoJS` makes payload validation straightforward by letting you express validation rules
directly through `TypeScript` types.

You write the type once, and it serves both as compile-time safety
and runtime validation enforcement.

## 🎯 Validation Targets

`KosmoJS` provides fine-grained control over what gets validated through **validation targets**.
Each target represents a different part of the incoming HTTP request:

**Metadata Targets** (available for all HTTP methods):
- `query` - URL query parameters (`?page=1&limit=10`)
- `headers` - HTTP request headers (`Authorization`, `Content-Type`, etc.)
- `cookies` - HTTP cookies

**Body Targets** (available for POST/PUT/PATCH):
- `json` - JSON request body
- `form` - URL-encoded or Multipart form
- `raw` - Raw body format (plain text, binary data, Buffer, ArrayBuffer, Blob)

You can validate any combination of metadata targets (query, headers, cookies)
along with **at most one** body target per handler.
Body targets are mutually exclusive - a request can only have one body format.


```ts
// ✅ Valid: Multiple metadata targets + one body target
POST<{
  query: { page: number };
  headers: { authorization: string };
  json: { title: string };
}>

// ✅ Valid: Only metadata targets
GET<{
  query: { search: string };
  headers: { 'x-api-key': string };
  cookies: { session: string };
}>

// ❌ Invalid: Multiple body targets
POST<{
  json: { title: string };
  form: { title: string };  // Error: only one body target allowed
}>

// ❌ Invalid: Body target on GET request
GET<{
  json: { data: string };  // Error: GET cannot have request body
}>
```

During development, `KosmoJS` detects these misconfigurations and displays warnings,
automatically disabling validation schemas for affected handlers to prevent runtime errors.

## 📦 Validating Request Payloads

`KosmoJS` makes payload validation as simple as providing types to your method handler.

You can use literal type definitions written inline, or you can reference types defined elsewhere and imported.

The simplest approach is to define the payload type inline as the first type argument to your method handler,
specifying which validation targets you want to use:

```ts [api/posts/index.ts]
import { defineRoute } from "_/front/api/posts";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      title: TRefine<string, { minLength: 1, maxLength: 255 }>;
      content: string;
      tags: string[];
      isPublished: boolean;
      scheduledPublishAt?: TRefine<string, { format: "date-time" }>;
    },
  }>(async (ctx) => {
    // ctx.validated.json is fully validated and typed // [!code hl]
    const { title, content, tags } = ctx.validated.json;
  }),
]);
```

In this example, we're creating a blog post endpoint that validates the `json` body target.

🔹The title must be a non-empty string no longer than 255 characters.<br/>
🔹The content is required but has no length constraints.<br/>
🔹Tags must be an array of strings.<br/>
🔹The published status is a required boolean.<br/>
🔹The scheduled publish time is optional, but when provided, it must be valid.

Notice how `TRefine` is used to add validation constraints to specific fields.

The `minLength` and `maxLength` constraints ensure titles aren't empty or excessively long.

The `format: "date-time"` constraint leverages JSON Schema's format validation
to ensure dates are properly formatted.

Without `TRefine`, fields are validated only for their basic type - a string must be a string,
an array must be an array, but no additional constraints apply.

The question mark after `scheduledPublishAt` makes it optional.
Optional fields can be omitted from the payload entirely.
If they are present, they must match their specified type and pass any refinement constraints.

## 🏗️ Complex Nested Structures

Real-world payloads often have deeply nested structures with conditional fields and references to other types.
`KosmoJS` handles this complexity naturally because you're just writing `TypeScript` types.

You can nest objects, use union types for conditional fields, reference other types,
and generally express any structure that `TypeScript` can represent.

Here's a more complex example for a payment processing endpoint:

```ts [api/example/index.ts]
export default defineRoute(({ POST }) => [
  POST<{
    json: {
      orderId: TRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
      amount: TRefine<number, { minimum: 0.01, maximum: 1000000 }>;
      currency: TRefine<string, { pattern: "^[A-Z]{3}$" }>;
      paymentMethod: {
        type: "card" | "wallet";
        card?: {
          number: TRefine<string, { pattern: "^[0-9]{13,19}$" }>;
          expMonth: TRefine<number, { minimum: 1, maximum: 12 }>;
          expYear: number;
          cvc: TRefine<string, { pattern: "^[0-9]{3,4}$" }>;
          holderName: string;
        };
        wallet?: {
          walletId: string;
          token: TRefine<string, { minLength: 1, maxLength: 500 }>;
        };
      };
      billingAddress: {
        line1: TRefine<string, { minLength: 1, maxLength: 100 }>;
        line2?: string;
        city: string;
        state: TRefine<string, { minLength: 2, maxLength: 2 }>;
        postalCode: TRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
        country: string;
      };
    },
  }>(async (ctx) => {
    // Every field is validated according to its constraints
  }),
]);
```

This payload type demonstrates several advanced patterns.

The `orderId` uses a regex pattern to ensure it contains only alphanumeric characters, underscores, and hyphens.

The `amount` must be a positive number (at least one cent) capped at a reasonable maximum.

The `currency` must be a three-letter uppercase code.

The `paymentMethod` field shows conditional validation.

And so on...

All of these constraints are checked at runtime before your handler executes.
If any field fails validation, `KosmoJS` rejects the request
with a detailed validation error that tells the client exactly what went wrong.

## 🎨 Combining Multiple Targets

You can validate multiple parts of the request simultaneously by specifying multiple targets.
This is particularly useful for endpoints that need to validate query parameters, headers, and request body together:

```ts [api/posts/search.ts]
import { defineRoute } from "_/front/api/posts/search";

export default defineRoute(({ POST }) => [
  POST<{
    query: {
      page: TRefine<number, { minimum: 1 }>;
      limit: TRefine<number, { minimum: 1, maximum: 100 }>;
      sortBy?: "date" | "title" | "views";
    };
    headers: {
      authorization: TRefine<string, { pattern: "^Bearer .+" }>;
      "x-api-version"?: string;
    };
    cookies: {
      session: string;
    };
    json: {
      filters: {
        tags?: string[];
        status?: "draft" | "published" | "archived";
        dateRange?: {
          from: TRefine<string, { format: "date-time" }>;
          to: TRefine<string, { format: "date-time" }>;
        };
      };
    };
  }>(async (ctx) => {
    // All targets are validated and typed
    const { page, limit, sortBy } = ctx.validated.query;
    const { authorization } = ctx.validated.headers;
    const { session } = ctx.validated.cookies;
    const { filters } = ctx.validated.json;

    // Use validated data safely...
  }),
]);
```

In this search endpoint:
- Query parameters control pagination (`page`, `limit`) and sorting (`sortBy`)
- Headers provide authentication (`authorization`) and API versioning
- Cookies maintain the session
- The JSON body contains complex search filters

Each target is independently validated, and all must pass validation before your handler executes.
This ensures complete request validation across all input sources.

## 📝 Different Body Formats

Different endpoints may accept different body formats. Here are examples of each body target:

### JSON Body
```ts
POST<{
  json: {
    name: string;
    email: TRefine<string, { format: "email" }>;
  };
}>(async (ctx) => {
  const { name, email } = ctx.validated.json;
})
```

### Form Data (URL-encoded)
```ts
POST<{
  form: {
    username: TRefine<string, { minLength: 3, maxLength: 20 }>;
    password: TRefine<string, { minLength: 8 }>;
  };
}>(async (ctx) => {
  const { username, password } = ctx.validated.form;
})
```

### Multipart Form Data (File Uploads)
```ts
POST<{
  form: {
    file: File; // File upload
    title: string;
    description?: string;
  };
}>(async (ctx) => {
  const { file, title, description } = ctx.validated.form;
})
```

### Raw Body (Text, Binary, Buffer)
```ts
POST<{
  raw: TRefine<string, { minLength: 1, maxLength: 10000 }>;
}>(async (ctx) => {
  const rawContent = ctx.validated.raw;
  // Process raw text/binary data...
})
```

Remember: you can only specify **one body target** per handler (`json`, `form` or `raw`),
but you can combine it with any number of metadata targets (`query`, `headers`, `cookies`).

## 🔗 Working with Referenced Types

As your application grows, defining complex types inline becomes unwieldy.
You'll want to define types once and reuse them across multiple routes.

`KosmoJS` fully supports this pattern - you can define types in separate files,
import them where needed, and use them for validation just like inline types.

Suppose you have a file defining user-related types:

```ts [types/user.ts]
export type UserProfile = {
  name: TRefine<string, { minLength: 1, maxLength: 255 }>;
  email: TRefine<string, { format: "email" }>;
};

export type UserPreferences = {
  theme: "light" | "dark";
  notifications: NotificationPreferences;
};

type NotificationPreferences = {
  enabled: boolean;
};
```

And another file defining API payload wrappers:

```ts [types/api-payload.ts]
import type { UserProfile, UserPreferences } from "./user";

export type Payload<T> = {
  data: T;
  meta: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    cache: {
      ttl: number;
      revalidate: boolean;
    };
  };
};

export type User = {
  id: number;
  profile: UserProfile;
  preferences: UserPreferences;
  posts: Post[];
};

export type Post = {
  id: TRefine<number, { minimum: 1, multipleOf: 1 }>;
  title: string;
  tags: { id: string; name: string }[];
  stats?: { views: number; likes: number };
};
```

Now you can use these types in any route by importing them:

```ts [api/users/index.ts]
import type { User, Payload } from "@/front/types/api-payload";
import { defineRoute } from "_/front/api/users";

export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<User>, // [!code hl]
  }>(async (ctx) => {
    // ctx.validated.json is fully validated as Payload<User>
  }),
]);
```

`KosmoJS`'s type-to-schema conversion handles complex type constructs including generics,
unions, intersections, and deeply nested structures.

When you use `Payload<User>`, the generator resolves the generic type parameter,
traces through all the referenced types (including `UserProfile` and `UserPreferences`),
and generates a complete validation schema that validates the entire structure.

This means you can build a library of reusable types that encode your domain model and validation rules once,
then reference them throughout your API.

Changes to these type definitions automatically update the validation behavior everywhere they're used.

Different routes can use the same generic type with different parameters:

```ts [api/posts/index.ts]
import type { Post, Payload } from "@/front/types/api-payload";
import { defineRoute } from "_/front/api/posts";

export default defineRoute(({ POST }) => [
  POST<{
    json: Payload<Post>, // [!code hl]
  }>(async (ctx) => {
    // ctx.validated.json is fully validated as Payload<Post>
  }),
]);
```

Both routes benefit from the same payload wrapper structure with its metadata and pagination fields,
but validate different data types within that structure.

This composability makes your validation logic both DRY and maintainable.
