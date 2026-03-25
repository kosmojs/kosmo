---
title: Parameter Validation
description: Validate route parameters at runtime with type refinements using defineRoute type arguments.
    Convert string URL parameters to validated numbers, integers, or constrained values with VRefine.
head:
  - - meta
    - name: keywords
      content: parameter validation, route parameters, type refinement, url validation,
        numeric validation, VRefine, typed parameters, runtime param validation
---

Route parameters are extracted from the URL path as strings - that's just how URLs work.
But you often need more than a string: a numeric ID, a positive integer, a value from a fixed set or of a specific pattern, uuid, date, etc.

`KosmoJS` lets you express these requirements directly in the type system.

## 🎯 Params Refinements

Pass a tuple as the second type argument to `defineRoute`.
Each position refines the corresponding parameter in route order.

For a route at `api/users/[id]/index.ts`:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/front/api";

export default defineRoute<"users/[id]", [
  number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // typed as number // [!code hl]
  }),
]);
```

A request to `/api/users/abc` is rejected with a 400 before your handler runs.

Access validated parameters through `ctx.validated.params` - it carries the refined type,
not the raw string. The underlying `ctx.params` (Koa) or `ctx.req.param()` (Hono) still exists
if you need the original.

Refine further with `VRefine` (globally available, no import needed):

```ts [api/users/[id]/index.ts]
export default defineRoute<"users/[id]", [
  VRefine<number, { minimum: 1, multipleOf: 1 }> // positive integer // [!code hl]
]>(({ GET }) => [
  // ...
]);
```

[More on VRefine ➜ ](/validation/refine)

## 🚥 Multiple Parameters

For routes with multiple parameters, each tuple position maps to the corresponding param.
Positions are optional - omit any you don't need to refine.

```ts [api/users/[id]/[view]/index.ts]
export default defineRoute<"users/[id]/[view]", [
  VRefine<number, { minimum: 1, multipleOf: 1 }>, // id // [!code hl]
  "profile" | "settings" | "data"                 // view // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id, view } = ctx.validated.params; // [!code hl]
  }),
]);
```

Refinements are positional, not name-based - renaming `[id]` to `[userId]` requires no changes here.
