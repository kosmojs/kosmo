---
title: Slot Composition
description: Override global middleware using KosmoJS's slot system. Replace default body parsers,
    customize payload construction, and use multer for file uploads with fine-grained middleware control.
head:
  - - meta
    - name: keywords
      content: middleware slots, bodyparser override, form data, file upload, multer,
        middleware composition, custom parsers, middleware replacement
---

`KosmoJS`'s slot system gives you fine-grained control over middleware composition and override behavior.

Using slot composition, you can precisely control which middleware runs and when,
including selective overrides.

This becomes important when working with global middleware that applies to all routes
but needs customization for specific endpoints.

`KosmoJS` applies certain middleware globally through a core configuration file
located at `api/use.ts`.

This file defines middleware that runs for every API endpoint by default.
However, individual routes can override this default behavior using slots.

A slot is essentially a named position in the middleware chain.
When you assign a slot name to middleware, any subsequent middleware
with the same slot name replaces the earlier one.

This replacement mechanism gives you fine-grained control over which middleware runs where.

Let's look at a concrete example from `KosmoJS`'s core configuration:

```ts [api/use.ts]
import { use } from "_/front/api";

export default [
  use(
    async function useErrorHandler(ctx, next) {
      // default error handler
    },
    { slot: "errorHandler" },
  ),
];
```

Now suppose you have an endpoint that needs custom error handler.
You can override the `errorHandler` middleware by using the same slot name:

```ts [api/example/index.ts]
import { defineRoute } from "_/front/api/upload";

export default defineRoute(({ POST, use }) => [
  use(
    async (ctx, next) => {
      // custom error handler
    },
    { slot: "errorHandler" },
  ),

  POST(async (ctx) => {
    // ...
  }),
]);
```

By using `slot: "errorHandler"`, this route-specific middleware replaces
the default error handler for this endpoint only.

**Important:** When you override middleware using a slot,
you must explicitly specify which methods it should run on with the `on` option.
The `on` configuration doesn't inherit from the middleware you're replacing.

If you omit the `on` option, your slotted middleware will run for all HTTP methods,
which might not be what you want and could cause errors for methods that don't expect that processing.
