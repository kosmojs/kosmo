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

Payload validation covers everything your API receives from clients:
query parameters, headers, cookies for any method,
and request bodies for POST/PUT/PATCH.

`KosmoJS` makes payload validation straightforward by letting you express validation rules
directly through `TypeScript` types.

You write the type once, and it serves both as compile-time safety
and runtime validation enforcement.

## 🎯 Validation Targets

Each target maps to a part of the incoming HTTP request.

**Metadata targets** (all HTTP methods):
- `query` - URL query parameters (`?page=1&limit=10`)
- `headers` - HTTP request headers
- `cookies` - HTTP cookies

**Body targets** (POST/PUT/PATCH only):
- `json` - JSON request body
- `form` - URL-encoded or multipart form
- `raw` - plain text, binary, Buffer, ArrayBuffer, Blob

Any combination of metadata targets is valid. Body targets are mutually exclusive - one per handler.

```ts
// ✅ Multiple metadata targets + one body target
POST<{
  query: { page: number };
  headers: { authorization: string };
  json: { title: string };
}>

// ✅ Only metadata targets
GET<{
  query: { search: string };
  headers: { 'x-api-key': string };
  cookies: { session: string };
}>

// ❌ Multiple body targets
POST<{
  json: { title: string };
  form: { title: string };  // Error: only one body target allowed
}>

// ❌ Body target on GET
GET<{
  json: { data: string };  // Error: GET cannot have request body
}>
```

Invalid configurations are detected at dev time - `KosmoJS` warns and disables affected schemas automatically.

## 📦 Basic Payload Validation

Pass the payload type as the first type argument to your method handler:

```ts [api/posts/index.ts]
import { defineRoute } from "_/front/api";

export default defineRoute<"posts">(({ POST }) => [
  POST<{
    json: {
      title: TRefine<string, { minLength: 1, maxLength: 255 }>;
      content: string;
      tags: string[];
      isPublished: boolean;
      scheduledPublishAt?: TRefine<string, { format: "date-time" }>;
    },
  }>(async (ctx) => {
    const { title, content, tags } = ctx.validated.json; // [!code hl]
  }),
]);
```

Optional fields (`?`) can be omitted entirely. When present, they must still pass their type and refinement constraints.

Notice how `TRefine` is used to add validation constraints to specific fields.

The `minLength` and `maxLength` constraints ensure titles aren't empty or excessively long.

The `format: "date-time"` constraint leverages JSON Schema's format validation
to ensure dates are properly formatted.

Without `TRefine`, fields are validated only for their basic type - a string must be a string,
an array must be an array, but no additional constraints apply.

[More on TRefine ➜ ](/validation/refine)

## 🏗️ Complex Nested Structures

Since validation rules are just `TypeScript` types, nested objects, union types,
conditional fields, referenced types - all work naturally:

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
    // every field validated before handler runs
  }),
]);
```

## 🎨 Combining Multiple Targets

You can validate multiple parts of the request simultaneously by specifying multiple targets.
This is particularly useful for endpoints that need to validate query parameters, headers, and request body together:

```ts [api/posts/search.ts]
export default defineRoute<"posts/search">(({ POST }) => [
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
    const { page, limit, sortBy } = ctx.validated.query;
    const { authorization } = ctx.validated.headers;
    const { session } = ctx.validated.cookies;
    const { filters } = ctx.validated.json;
  }),
]);
```

Each target is validated independently. All must pass before your handler executes.

## 📝 Body Formats

### JSON
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

### Form (URL-encoded)
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

### Multipart (file uploads)
```ts
POST<{
  form: {
    file: File;
    title: string;
    description?: string;
  };
}>(async (ctx) => {
  const { file, title, description } = ctx.validated.form;
})
```

### Raw
```ts
POST<{
  raw: TRefine<string, { minLength: 1, maxLength: 10000 }>;
}>(async (ctx) => {
  const rawContent = ctx.validated.raw;
})
```

**Worth noting:** you can only specify **one body target** per handler (`json`, `form` or `raw`),
but you can combine it with any number of metadata targets (`query`, `headers`, `cookies`).

## 🔗 Referenced Types

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

```ts [types/api-payload.ts]
import type { UserProfile, UserPreferences } from "./user";

export type Payload<T> = {
  data: T;
  meta: {
    pagination?: { page: number; limit: number; total: number };
    cache: { ttl: number; revalidate: boolean };
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
import { defineRoute } from "_/front/api";

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: Payload<User>, // [!code hl]
  }>(async (ctx) => {
    // ctx.validated.json typed as Payload<User>
  }),
]);
```

The generator resolves generics, traces all referenced types, and builds a complete validation schema.
Update a shared type and validation updates everywhere it's used.

Different routes, same wrapper:

```ts [api/posts/index.ts]
import type { Post, Payload } from "@/front/types/api-payload";

export default defineRoute<"posts">(({ POST }) => [
  POST<{
    json: Payload<Post>, // [!code hl]
  }>(async (ctx) => {}),
]);
```
