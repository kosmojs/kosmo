---
title: VRefine for Type Refinement
description: Advanced validation constraints with VRefine using JSON Schema keywords.
    Validate string formats, numeric ranges, array constraints, and custom patterns directly in TypeScript types.
head:
  - - meta
    - name: keywords
      content: VRefine, type refinement, json schema constraints, validation rules,
        string validation, numeric validation, pattern matching, format validation
---

`VRefine` adds JSON Schema constraints to a primitive type. It's globally available - no import needed.

```ts
VRefine<number, { minimum: 1000, maximum: 1_000_000 }>
```

The first argument is the base type, the second is any valid
[JSON Schema validation keyword](https://json-schema.org/draft/2020-12/json-schema-validation.html):

- **Strings:** `minLength`, `maxLength`, `pattern`, `format`
- **Numbers:** `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- **Arrays:** `minItems`, `maxItems`, `uniqueItems`

One common gotcha: `number` alone allows decimals. If you need a true integer, use `multipleOf: 1` -
it means the value must be evenly divisible by 1:

```ts
// allows 1000.5 - probably not what you want
VRefine<number, { minimum: 1000, maximum: 1_000_000 }>

// integers only
VRefine<number, { minimum: 1000, maximum: 1_000_000, multipleOf: 1 }>
```

This matters especially for database IDs, where a float would pass validation
but get rejected at the query level - turning a clear validation error into a confusing DB error.
