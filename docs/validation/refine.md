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

### Inline the constraints, never reference them

The second argument to `VRefine` must always be written inline as an object literal.
Do not extract it into a named type and reference it - not a local `type` alias,
not an imported one:

```ts
// ✅ works - constraints inlined
VRefine<string, { pattern: "^[A-Z]{3}$" }>

// ❌ broken - constraint referenced by name
type CurrencyConstraints = { pattern: "^[A-Z]{3}$" };
VRefine<string, CurrencyConstraints>
```

Both forms typecheck and look equivalent, but only the inlined one produces a working
runtime schema. This is the same rule that applies to the tuples in `params` refinements
and `response` bodies: those must be inlined too, for the same underlying reason.

The reason is that the second argument is not consumed as a TypeScript type at runtime.
The generator flattens your route types and emits the constraints as schema text,
which is then re-parsed by TypeBox's `Type.Script` against a fixed set of known identifiers
(`VRefine`, `TDate`, and the other custom types).

A named reference like `CurrencyConstraints` survives flattening as a bare identifier that `Type.Script` has no definition for,
so the schema fails to build and every value is rejected -
a validation that silently says "no" to everything rather than raising a clear error.

The base type (the first argument) has no such restriction - it is flattened normally, so
`VRefine<MyStringAlias, { ... }>` and imported base types resolve as expected.
The constraint object is the one position that must stay literal.
