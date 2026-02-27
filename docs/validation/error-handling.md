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

When route parameters, request payloads, or response data don't match the expected schema,
the validation generator throws a `ValidationError`.

This error contains detailed information about the validation failure,
including the scope (whether it was a parameter, payload, or response that failed)
and descriptive error messages.

Your `api/use.ts` provides a basic error handler middleware in the `errorHandler` slot.
You can customize it for your specific error handling requirements -
add logging, change response formats, or emit events.

## 📦 Default Error Handler

The default error handler checks if an error is a `ValidationError`
and returns a 400 Bad Request status with error message:

```ts [api/use.ts]
import { use, ValidationError } from "@kosmojs/api/errors";

// Define global middleware applied to all source folders.
// Can be overridden on a per-route basis using the slot key.
export default [
  use(
    async function useErrorHandler(ctx, next) {
      try {
        await next();
      } catch (error: any) {
        if (error instanceof ValidationError) {
          const { target, errorMessage } = error;
          ctx.status = 400;
          ctx.body = { error: `ValidationError: ${target} - ${errorMessage}` };
        } else {
          ctx.status = error.statusCode || error.status || 500;
          ctx.body = { error: error.message };
        }
      }
    },
    { slot: "errorHandler" },
  ),

  // ...
];
```

This file is yours to customize.
You can modify how errors are formatted, add logging, implement custom error responses,
or handle specific error types differently.

## 🔧 ValidationError Details

The ValidationError class provides rich, structured information when validation fails,
making error handling both precise and developer-friendly.

Here's the implementation imported from `@kosmojs/api/errors`:

```ts
export class ValidationError extends Error {
  public target: ValidationTarget;
  public errors: Array<ValidationErrorEntry> = [];
  public errorMessage: string;
  public errorSummary: string;
  public route: string;
  public data: unknown;

  constructor([target, { errors, errorMessage, errorSummary, route, data }]: [
    ValidationTarget,
    ValidationErrorData,
  ]) {
    super(JSON.stringify(errors, null, 2));
    this.name = `${target}ValidationError`;
    this.target = target;
    this.errors = errors;
    this.errorMessage = errorMessage;
    this.errorSummary = errorSummary;
    this.route = route;
    this.data = data;
  }
}

/**
 * Shape of individual validation errors emitted by generators.
 * */
export type ValidationErrorEntry = {
  /**
   * JSON Schema keyword that triggered the error
   * (e.g. `format`, `maxItems`, `maxLength`).
   * */
  keyword: string;
  /**
   * JSON Pointer–style path to the invalid field
   * (matches JSON Schema `instancePath`).
   * */
  path: string;
  /**
   * Human-readable error message.
   * */
  message: string;
  /**
   * Constraint parameters (e.g. `{ limit: 5 }`, `{ format: "email" }`).
   * */
  params?: Record<string, unknown>;
  /**
   * Optional error code for i18n/l10n or custom handling.
   * */
  code?: string;
};

export type ValidationErrorData = {
  errors: Array<ValidationErrorEntry>;
  /**
   * Formats errors into a single human-readable message.
   * @example: Validation failed: user: missing required properties:
   * "email", "name"; password: must be at least 8 characters long
   * */
  errorMessage: string;
  /**
   * Gets a simple error summary for quick feedback.
   * @example: 2 validation errors found across 2 fields
   * */
  errorSummary: string;

  // route name
  route: string;

  // data that failed validation
  data: unknown;
};
```

## 🔍 Working with ValidationError Properties

As seen in the implementation, a `ValidationError` instance provides several properties
for handling validation failures flexibly.

The `errors` property is an array of `ValidationErrorEntry` objects,
each describing a specific validation failure.

You can iterate through this array to collect error details and format them as needed:

```ts
if (error instanceof ValidationError) {
  const { target, errors } = error;

  // Collect all error messages
  const messages = errors.map(e => `${e.path}: ${e.message}`);

  ctx.status = 400;
  ctx.body = {
    error: "validation_error",
    target,
    messages,
  };
}
```

Or extract just the first error for a simple response:

```ts
if (error instanceof ValidationError) {
  const { target, errors } = error;
  const firstError = errors[0];

  ctx.status = 400;
  ctx.body = {
    error: "validation_error",
    target,
    field: firstError.path,
    message: firstError.message,
  };
}
```

For convenience, the `errorMessage` property provides a human-readable message
containing all error messages concatenated:

```ts
if (error instanceof ValidationError) {
  const { target, errorMessage } = error;

  // errorMessage example:
  // Validation failed: user: missing required properties: "email", "name";
  // password: must be at least 8 characters long

  ctx.status = 400;
  ctx.body = { error: errorMessage };
}
```

The `errorSummary` property offers a brief overview of validation failures:

```ts
if (error instanceof ValidationError) {
  const { target, errorSummary } = error;

  // errorSummary example: "2 validation errors found across 2 fields"

  logger.warn(`Validation failed in ${target}: ${errorSummary}`);

  ctx.status = 400;
  ctx.body = { error: errorSummary };
}
```

The `target` property tells you which part of the request failed validation:

- `"param"` - Route parameter validation failures
- `"query"` - Query parameter validation failures
- `"headers"` - Request headers validation failures
- `"cookies"` - Cookie validation failures
- `"json"` - JSON request body validation failures
- `"form"` - Form data validation failures
- `"multipart"` - Multipart form data validation failures
- `"raw"` - Raw body validation failures
- `"response"` - Response validation failures (data your handler tried to return)

This granularity helps you provide targeted error messages to clients
and aids in debugging by pinpointing exactly where validation failed in the request lifecycle.

The `data` property contains the actual data that failed validation.
This can be useful for logging, debugging, or providing additional context in error responses:

```ts
if (error instanceof ValidationError) {
  const { target, data, errorSummary } = error;

  // Log the invalid data for debugging
  logger.error("Validation failed", {
    target,
    invalidData: data,
    summary: errorSummary
  });

  ctx.status = 400;
  ctx.body = { error: errorSummary };
}
```

Each `ValidationErrorEntry` in the `errors` array contains:

- `keyword` - The JSON Schema validation rule that failed (e.g., "minLength", "format", "required")
- `path` - JSON Pointer-style path to the invalid field (e.g., "user.email", "items.0.name")
- `message` - A human-readable description of what went wrong
- `params` - Optional constraint details (e.g., `{ limit: 5 }` for a maxLength failure)
- `code` - Optional error code for internationalization or custom error handling

This structured information allows you to build sophisticated error responses
tailored to your application's needs, whether that's detailed field-level feedback for forms
or aggregated error summaries for API consumers.

## 🎨 Custom Error Messages

`KosmoJS` allows you to provide custom error messages for validation failures
by specifying them as the second type argument to your route handler.

This gives you full control over the error messages your API returns,
enabling better user experience and internationalization support.

Custom error messages are organized by validation target (just like the first type argument),
and you can provide both generic messages and field-specific messages:

```ts [api/users/index.ts]
import { defineRoute } from "_/front/api/users";

export default defineRoute(({ POST }) => [
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
    // Handle validated data...
  }),
]);
```

In this example:
- `error` is the generic fallback message for any validation failure in the `json` target
- `error.id`, `error.email`, `error.age` are field-specific messages

When validation fails, `KosmoJS` uses the most specific error message available.
If a field-specific message exists, it's used; otherwise, the generic `error` message is used.

### Custom Messages for Multiple Targets

You can provide custom error messages for any validation target:

```ts [api/posts/search/index.ts]
import { defineRoute } from "_/front/api/posts/search";

export default defineRoute(({ POST }) => [
  POST<
    {
      query: {
        page: number;
        limit: number;
      };
      headers: {
        authorization: string;
      };
      json: {
        filters: {
          tags?: string[];
          status?: "draft" | "published";
        };
      };
    },
    {
      query: {
        error: "Invalid pagination parameters",
        "error.page": "Page number must be a positive integer",
        "error.limit": "Limit must be between 1 and 100",
      };
      headers: {
        error: "Missing or invalid headers",
        "error.authorization": "Authorization header is required",
      };
      json: {
        error: "Invalid search filters",
        "error.filters.status": "Status must be either 'draft' or 'published'",
      };
    }
  >(async (ctx) => {
    const { page, limit } = ctx.validated.query;
    const { authorization } = ctx.validated.headers;
    const { filters } = ctx.validated.json;
    // Handle search...
  }),
]);
```

Each validation target can have its own set of custom error messages.
This allows you to provide context-appropriate feedback for different parts of the request.

### Nested Field Error Messages

For deeply nested structures, use dot notation to specify field paths:

```ts [api/orders/index.ts]
export default defineRoute(({ POST }) => [
  POST<
    {
      json: {
        order: {
          items: Array<{
            productId: number;
            quantity: number;
          }>;
          shipping: {
            address: {
              street: string;
              city: string;
              postalCode: string;
            };
          };
        };
      };
    },
    {
      json: {
        error: "Invalid order data",
        "error.order.items": "Order must contain at least one item",
        "error.order.items.productId": "Product ID is required",
        "error.order.items.quantity": "Quantity must be a positive number",
        "error.order.shipping.address.street": "Street address is required",
        "error.order.shipping.address.postalCode": "Invalid postal code format",
      };
    }
  >(async (ctx) => {
    const { order } = ctx.validated.json;
    // Process order...
  }),
]);
```

### Benefits of Custom Error Messages

Custom error messages provide several advantages:

🔹 **User-Friendly** - Replace technical JSON Schema errors with human-readable messages<br/>
🔹 **Domain-Specific** - Provide context that makes sense for your business logic<br/>
🔹 **Consistent** - Maintain consistent error messaging across your entire API

When validation fails, the custom error messages are automatically integrated
into the `ValidationError` instance, appearing in the `message` field of each
`ValidationErrorEntry`. Your error handler can then use these custom messages
to provide better feedback to API consumers.
