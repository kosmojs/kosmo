---
title: Validation Error Handler
description: Handle ValidationError instances with detailed error information including scope,
    error messages, field paths, and structured ValidationErrorEntry data.
head:
  - - meta
    - name: keywords
      content: error handling, ValidationError, error messages, validation scope,
        error logging, field errors, structured errors, error response
---

When validation fails - on parameters, request payload, or response - `KosmoJS` throws a `ValidationError`
with detailed information about what went wrong and where.

Your `api/errors.ts` is the central place to handle it. The generated file gives you a working default;
customize it freely to add logging, change response formats, or handle specific error types differently.

## 📦 Default Error Handler

::: code-group
```ts [Koa: api/errors.ts]
import { ValidationError } from "@kosmojs/api/errors";
import { errorHandlerFactory } from "_/front/api-factory";

export default errorHandlerFactory(
  async function defaultErrorHandler(ctx, next) {
    try {
      await next();
    } catch (error: any) {
      const [errorMessage, status] =
        error instanceof ValidationError
          ? [`${error.target}: ${error.errorMessage}`, 400]
          : [error.message, error.statusCode || 500];
      if (ctx.accepts("json")) {
        ctx.status = 400;
        ctx.body = { error: errorMessage };
      } else {
        ctx.status = status;
        ctx.body = errorMessage;
      }
    }
  },
);
```

```ts [Hono: api/errors.ts]
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";
import { ValidationError } from "@kosmojs/api/errors";
import { errorHandlerFactory } from "_/front/api-factory";

export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const [message, status] =
      error instanceof ValidationError
        ? [`${error.target}: ${error.errorMessage}`, 400]
        : [error.message, error.statusCode || 500];

    const type = accepts(ctx, {
      header: "Accept",
      supports: ["application/json", "text/plain"],
      default: "text/plain",
    });

    return type === "application/json"
      ? ctx.json({ error: message }, status)
      : ctx.text(message, status);
  },
);
```
:::

## 🔧 ValidationError Properties

```ts
export class ValidationError extends Error {
  public target: ValidationTarget;   // which part of the request failed
  public errors: Array<ValidationErrorEntry> = [];
  public errorMessage: string;       // all errors as a single readable string
  public errorSummary: string;       // e.g. "2 validation errors found across 2 fields"
  public route: string;
  public data: unknown;              // the data that failed validation
}

export type ValidationErrorEntry = {
  keyword: string;                   // JSON Schema keyword that triggered the error
  path: string;                      // path to the invalid field
  message: string;                   // human-readable description
  params?: Record<string, unknown>;  // constraint details, e.g. { limit: 5 }
  code?: string;                     // optional code for i18n / custom handling
};
```

The `target` property tells you exactly which part of the request failed:
`"params"`, `"query"`, `"headers"`, `"cookies"`, `"json"`, `"form"`, `"raw"`, or `"response"`.

**Common handling patterns:**

```ts
// All errors as a readable string
if (error instanceof ValidationError) {
  const { target, errorMessage } = error;
  // e.g. "Validation failed: user: missing required properties: "email", "name";
  //       password: must be at least 8 characters long"
  ctx.status = 400;
  ctx.body = { error: errorMessage };
}

// Field-level errors (useful for form responses)
if (error instanceof ValidationError) {
  const messages = error.errors.map(e => `${e.path}: ${e.message}`);
  ctx.status = 400;
  ctx.body = { error: "validation_error", target: error.target, messages };
}

// Log the invalid data, return a summary
if (error instanceof ValidationError) {
  logger.error("Validation failed", { target: error.target, data: error.data });
  ctx.status = 400;
  ctx.body = { error: error.errorSummary };
}
```

## 🎨 Custom Error Messages

The second type argument to your handler also accepts custom error messages per target.
Use `error` as a fallback and `error.fieldName` for field-specific overrides:

```ts [api/users/index.ts]
export default defineRoute<"users">(({ POST }) => [
  POST<
    {
      json: {
        id: number;
        email: string;
        age: number;
      };
    },
    {
      json: {
        error: "Invalid user data provided",
        "error.id": "User ID must be a valid number",
        "error.email": "Please provide a valid email address",
        "error.age": "Age must be a number",
      };
    }
  >(async (ctx) => {
    const { id, email, age } = ctx.validated.json;
  }),
]);
```

Each target has its own message set. For nested fields, use dot notation:

```ts
{
  json: {
    error: "Invalid order data",
    "error.order.items": "Order must contain at least one item",
    "error.order.shipping.address.postalCode": "Invalid postal code format",
  }
}
```

When validation fails, `KosmoJS` uses the most specific message available -
field-specific first, falling back to the generic `error` if no match is found.
Custom messages appear in the `message` field of each `ValidationErrorEntry`,
so your existing error handler picks them up automatically.
