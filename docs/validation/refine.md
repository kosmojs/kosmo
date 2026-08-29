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

## Keep the Wrapping Brackets Literal

One rule covers every place KosmoJS reads structure out of your type arguments:

::: tip The rule
**The wrapping `[]` and `{}` must be written literally. Anything *inside* them can be aliased.**
:::

That applies to three positions:

```ts
// the VRefine constraint object
VRefine<string, { pattern: "^[A-Z]{3}$" }>

// the params refinement tuple
defineRoute<"users/[id]/[action]", [UserID, UserAction]>

// the response tuple
POST<{ response: [200, "json", User] }>
```

In each case the brackets stay where you can see them, while the values inside are free to be named types - local or imported:

```ts
// ✅ contents aliased, brackets kept
type Pattern = "^[A-Z]{3}$";
VRefine<string, { pattern: Pattern }>

type UserID = VRefine<number, { minimum: 1, multipleOf: 1 }>;
defineRoute<"users/[id]", [UserID]>

type User = { id: number; name: string };
POST<{ response: [200, "json", User] }>
```

```ts
// ❌ the brackets themselves hidden behind an alias
type Params = [UserID, UserAction];
defineRoute<"users/[id]/[action]", Params>

type ResponseT = [200, "json", User];
POST<{ response: ResponseT }>
```

The base type of `VRefine` (its first argument) is unrestricted either way -
`VRefine<MyStringAlias, { ... }>` and imported base types resolve normally.

### Why the brackets matter

The generator reads these positions **structurally**, from the source: which tuple slot maps to which route parameter,
which slot carries the status code versus the body.
An alias that hides the brackets gives it an identifier where it expected a shape, and there is nothing to destructure.

That failure is silent, and it differs by position:

| Position | If the brackets are hidden behind an alias |
|---|---|
| `params` tuple | the schema does not build - **every** request is rejected with a 400 |
| `response`&nbsp;tuple | **no schema is generated at all** - response validation never runs, and the route gets no [`ResponseT`](/fetch/type-safety#response-types) entry |

Neither raises a compile error, so nothing points at the alias.
If a route rejects input you know is valid, or a response you declared is silently not validated, check the brackets first.

> This is one of the mistakes that typecheck cleanly and fail at runtime.
[Silent Failure Checklist ›](/validation/gotchas)
