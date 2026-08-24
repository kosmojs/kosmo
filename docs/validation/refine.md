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

`VRefine` adds JSON Schema constraints to any type - primitives, arrays, and objects alike.

```ts
VRefine<number, { minimum: 1000, maximum: 1_000_000 }>
```

> It is globally available - no import needed.

The first argument is the base type, the second is any valid
[JSON Schema validation keyword](https://json-schema.org/draft/2020-12/json-schema-validation.html).
The full keyword set, grouped as in the spec, is below - everything at a glance.

## Validation keywords

### Strings

| Keyword | Meaning |
| --- | --- |
| `minLength` | Minimum character count |
| `maxLength` | Maximum character count |
| `pattern` | Must match the ECMA-262 regular expression |
| `format` | Must match a named format - see [the format table](#formats) |

```ts
VRefine<string, { minLength: 3, maxLength: 50 }>
VRefine<string, { pattern: "^[a-z0-9][a-z0-9_-]*$" }>
VRefine<string, { format: "email" }>
```

### Numbers

| Keyword | Meaning |
| --- | --- |
| `minimum` | Inclusive lower bound |
| `maximum` | Inclusive upper bound |
| `exclusiveMinimum` | Exclusive lower bound |
| `exclusiveMaximum` | Exclusive upper bound |
| `multipleOf` | Must be evenly divisible by the given value |

```ts
VRefine<number, { minimum: 1, maximum: 100, multipleOf: 1 }>
VRefine<number, { exclusiveMinimum: 0 }>
```

### Arrays

| Keyword | Meaning |
| --- | --- |
| `minItems` | Minimum element count |
| `maxItems` | Maximum element count |
| `uniqueItems` | All elements must be distinct |
| `contains` | At least one element must match the given schema, written inline as a schema literal |
| `minContains` / `maxContains` | Bounds on how many elements may match `contains` |

```ts
VRefine<Array<string>, { minItems: 1, maxItems: 20 }>
VRefine<Array<VRefine<string, { format: "email" }>>, { uniqueItems: true }>

// at least one "admin" entry
VRefine<string[], { contains: { type: "string"; const: "admin" } }>

// one or two elements matching the nested schema - any keyword combination works,
// including pattern, enum, format, length bounds
VRefine<string[], {
  contains: { type: "string"; const: "premium" };
  minContains: 1;
  maxContains: 2;
}>
```

### Objects

| Keyword | Meaning |
| --- | --- |
| `minProperties` | Minimum property count |
| `maxProperties` | Maximum property count |
| `required` | Array of mandatory property names - normally implied by TypeScript optionality (`?`), reach for it only on open shapes like `Record` |
| `dependentRequired` | Properties required when another property is present |

```ts
VRefine<Record<string, string>, { maxProperties: 20 }>
```

### Any instance type

| Keyword | Meaning |
| --- | --- |
| `enum` | Must equal one of the listed values - as a top-level constraint a TypeScript literal union (`"a" \| "b"`) expresses this natively; inside a nested schema like `contains` it is the way to say it |
| `const` | Must equal a specific value - as a top-level constraint a TypeScript literal type (`"a"`, `2`, `true`) expresses this natively; inside a nested schema like `contains` it is the way to say it |
| `type` | Constrains the JSON type - redundant at the top level (the base type already is the type), required inside nested schemas like `contains` |

### Content keywords

`contentEncoding`, `contentMediaType`, and `contentSchema` describe how to interpret
string contents (e.g. base64 payloads). Per the spec they are **annotations, not
assertions** - they document, they don't reject. Fine to attach for OpenAPI output;
don't expect them to validate anything.

## Formats

`format: "..."` values are validated at runtime. Every format defined by the
2020-12 spec is supported, plus two TypeBox extras at the end:

| Format | Validates |
| --- | --- |
| `date-time` | RFC 3339 timestamp, e.g. `2026-08-23T07:00:00Z` |
| `date` | Full date, e.g. `2026-08-23` |
| `time` | Time of day, e.g. `07:00:00Z` |
| `duration` | ISO 8601 duration, e.g. `P3DT4H` |
| `email` | Email address |
| `idn-email` | Internationalized email address |
| `hostname` | DNS hostname |
| `idn-hostname` | Internationalized hostname |
| `ipv4` | IPv4 address |
| `ipv6` | IPv6 address |
| `uri` | Absolute URI |
| `uri-reference` | URI or relative reference |
| `iri` | Internationalized URI |
| `iri-reference` | IRI or relative reference |
| `uuid` | UUID, e.g. `f81d4fae-7dec-11d0-a765-00a0c91e6bf6` |
| `uri-template` | RFC 6570 URI template |
| `json-pointer` | JSON Pointer, e.g. `/foo/0` |
| `relative-json-pointer` | Relative JSON Pointer |
| `regex` | ECMA-262 regular expression source |
| `url` | URL (TypeBox extra, not in the spec) |
| `json-pointer-uri-fragment` | JSON Pointer in URI fragment form (TypeBox extra) |

```ts
VRefine<string, { format: "uuid" }>    // params: id: must be a valid UUID
VRefine<string, { format: "email" }>   // json: from ➜ email: must be a valid email address
```

## Integers

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

## Inline the constraints, never reference them

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
