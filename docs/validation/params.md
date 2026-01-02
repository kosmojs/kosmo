---
title: Parameter Validation
description: Validate route parameters at runtime with type refinements using defineRoute type arguments.
    Convert string URL parameters to validated numbers, integers, or constrained values with TRefine.
head:
  - - meta
    - name: keywords
      content: parameter validation, route parameters, type refinement, url validation,
        numeric validation, TRefine, typed parameters, runtime param validation
---

Route parameters are values extracted from the URL path itself,
like the user ID in <span class="text-nowrap">`/api/users/123`</span>.

By default, these parameters are strings because URLs are text.

However, you often need to ensure parameters meet specific criteria -
perhaps a numeric ID should actually be a number type,
or perhaps it should fall within a certain range.

## 🎯 Params Refinements

`KosmoJS` lets you refine parameter types through a tuple passed as the first type argument to `defineRoute`.
This tuple uses positional parameters that align with your route's parameter order.

Consider a route at `api/users/[id]/index.ts` where you want to ensure the ID is a number.
You specify this by passing `[number]` as the first type argument `defineRoute`:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/front/api/users/[id]";

export default defineRoute<[
  number // validate id as number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    // ctx.typedParams.id is typed as number and validated at runtime // [!code hl]
    const userId = ctx.typedParams.id;
  }),
]);
```

With this type refinement, `KosmoJS` validates that the ID can be converted to a number at runtime.

If someone makes a request to `/api/users/abc`, where `abc` cannot be parsed as a number,
`KosmoJS` rejects the request with a validation error before your handler runs.
The client receives a 400 status code with information about what went wrong.

Notice that you access the validated parameter through `ctx.typedParams` rather than the standard `ctx.params`.
The typed version gives you the refined type (number in this case) rather than the original string type.

The standard `ctx.params` still exists if you need it for some reason,
but `ctx.typedParams` is what you'll typically use when you've provided type refinements.

You can refine parameters further by using `TRefine` (globally available, no need to import):

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/front/api/users/[id]";

export default defineRoute<[
  // validate id as a positive integer // [!code hl]
  TRefine<number, { minimum: 1, multipleOf: 1 }>
]>(({ GET }) => [
  // ...
]);
```

[More Details on TRefine ➜ ](/validation/refine)

## 🚥 Validating Multiple Parameters

When your route has multiple parameters, you provide type refinements positionally.

The first tuple argument refines the first parameter,
the second argument refines the second parameter, and so on.

All positions are optional, so you can refine just the parameters that need it.

For a route at `api/users/[id]/[view]/index.ts`:

```ts [api/users/[id]/[view]/index.ts]
import { defineRoute } from "_/front/api/users/[id]/[view]";

export default defineRoute<[
  // validate id as a positive integer // [!code hl]
  TRefine<number, { minimum: 1, multipleOf: 1 }>,
  // make sure view is one of // [!code hl]
  "profile" | "settings" | "data"
]>(({ GET }) => [
  GET(async (ctx) => {
    // Both id and view are validated at this point // [!code hl]
    const { id, view } = ctx.typedParams;
  }),
]);
```

If you only need to refine the first parameter, you can omit the second argument entirely.
The flexibility of positional parameters gives you fine-grained control over which parameters get validated and how.
