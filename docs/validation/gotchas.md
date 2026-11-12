---
title: Silent Failure Checklist
description: The three validation mistakes that typecheck cleanly and fail at runtime -
    non-inline VRefine constraints, float IDs, and non-coercing targets.
head:
  - - meta
    - name: keywords
      content: validation gotchas, silent failure, VRefine inline, unresolved types,
        multipleOf integer, coercion, debugging validation, always rejects
---

Most mistakes in KosmoJS are compile errors. Three are not: they typecheck cleanly and then misbehave at runtime.

They share a shape - each is valid TypeScript that means something narrower once it becomes a runtime check.

**If validation is rejecting data that looks obviously valid, work down this list first.**

## 1. A wrapping bracket hidden behind an alias

KosmoJS reads three positions **structurally**, out of the source:
the `VRefine` constraint object, the params refinement tuple, and the response tuple.
In all three, the wrapping `{}` or `[]` must be written literally.

**Anything inside them can be aliased** - local or imported. It is only the brackets
themselves that must stay visible.

```ts
// ✅ contents aliased, brackets kept
type Pattern = "^[A-Z]{3}$";
VRefine<string, { pattern: Pattern }>

type UserID = VRefine<number, { minimum: 1, multipleOf: 1 }>;
defineRoute<"users/[id]", [UserID]>
```

```ts
// ❌ the brackets themselves behind an alias
type Params = [UserID, UserAction];
defineRoute<"users/[id]/[action]", Params>

type ResponseT = [200, "json", User];
POST<{ response: ResponseT }>
```

Both forms typecheck. KosmoJS, though, expected a shape and got an identifier,
with nothing to destructure - so it fails, silently, and differently per position:

| Position | If the brackets are hidden |
|---|---|
| `params` tuple | schema does not build - **every** request 400s, including valid ones |
| `response`&nbsp;tuple | **no schema built** - response validation never runs, and the route gets no `ResponseT` entry |

**Symptom:** a route rejects input you know is good, or a response you declared is quietly
never validated - with no compile error pointing at the alias.
[Details&nbsp;›](/validation/refine#keep-the-wrapping-brackets-literal)

## 2. `number` where you meant integer

Normally, plain `number` allows decimals. A float ID passes validation and is then rejected by your database -
turning a clean 400 into a confusing query error further downstream.

```ts
// ❌ 1000.5 passes
VRefine<number, { minimum: 1 }>

// ✅ integers only
VRefine<number, { minimum: 1, multipleOf: 1 }>
```

**Symptom:** a DB driver error instead of a validation error.
[Details&nbsp;›](/validation/refine#integers)

## 3. A non-string type on a target that doesn't coerce

Everything off the wire is a string. Only `query` coerces numbers *and* booleans,
and route `params` coerce numbers only.

`headers`, `cookies`, `form` and `raw` never coerce anything.

| Target | `number` | `boolean` |
|---|:---:|:---:|
| `params` | ✅ coerced | ❌ never (a boolean path segment is meaningless) |
| `query` | ✅ coerced | ✅ coerced (`"true"` / `"false"`) |
| `json` | ✅ native | ✅ native |
| `headers` · `cookies` · `form` · `raw` | ❌ | ❌ |

```ts
// ❌ never passes - form values are strings
POST<{ form: { age: number; consented: boolean } }>

// ✅ accept the wire format, convert in the handler
POST<{ form: { age: string; consented: "true" | "false" | "on" | "off" } }>
```

**Symptom:** a form or header field always fails validation no matter what is sent.
[Details&nbsp;›](/validation/payload#coerced-values)

## Three more that aren't silent, but surprise people

<a id="a-type-that-does-not-resolve"></a>

**A type that does not resolve stops the route.** A name with no declaration the route can reach -
a typo, a moved file, a type built from a value with `typeof`, a type an ORM derives from a table -
cannot become a schema. KosmoJS warns when it builds the route, naming the route and the types,
and the route's validators throw when they load instead of rejecting every request:

```txt
✗ JsonTPOST123 references types that could not be resolved
  Nowhere
  Validation fails until they are: define or import them in the route, or in a file it imports
  Route: users
```

Write the shape out, or import it from a file the route can reach.
`Date`, `File`, `Blob`, `Buffer` and `ArrayBuffer` resolve on their own.
[Type names&nbsp;›](/validation/type-names)

**A missing `response` means no `ResponseT` entry.** Response typing on the client is opt-in:
declare `response` on the handler and you get response validation,
an OpenAPI response, and a `ResponseT["route"]["GET"]` entry together.
Omit it and you get none of the three.
[Details&nbsp;›](/fetch/type-safety#response-types)

**Response validation is off in production by default.** Requests are always validated;
responses are validated in development and test only,
unless you opt a specific handler in with `runtimeValidation: true`.
There is no global switch.
[Details&nbsp;›](/validation/response#development-vs-production)

## When Nothing Above Fits

Rebuilding is the blunt instrument, and occasionally the right one.

Remove `var/lib/` dir and restart dev server.

That forces a full rebuild of every schema - slower on a large project, so it is not part of the normal loop.
Reach for it when you suspect stale derived output rather than a mistake in your types.
[Details&nbsp;›](/validation/performance#when-it-becomes-noticeable)
