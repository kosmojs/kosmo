---
title: Type Names
description: Name validation types freely - a type you declare or import wins over a built-in
    of the same name, while Date, File, Blob, Buffer and ArrayBuffer are runtime types
    when nothing of yours is in scope.
head:
  - - meta
    - name: keywords
      content: type names, built-in types, naming, Event, Response, Date, custom types,
        validation types, typescript conventions
---

Any name works for a validation type, `Event`, `Response`, `Error` or `Record` included.

KosmoJS resolves a name the way your editor does:
a type declared in the route, or imported into it, is the type the schema is built from,
whatever built-in shares its name.

```ts
// ✅ the schema is built from this Event, not the DOM's
type Event = { id: number; name: string; timestamp: string };

export default defineRoute<"events">(({ POST }) => [
  POST<{ json: Event }>(async (ctx) => { /* ... */ }),
]);
```

The same holds for a type imported from another file, and for a name imported under an alias.

## Runtime Types

Five names mean a runtime type when nothing of yours is in scope:

| Name | Validates |
|---|---|
| `Date` | a `Date` instance |
| `File` | a `File` instance |
| `Blob` | a `Blob` instance |
| `Buffer` | a Node `Buffer` |
| `ArrayBuffer` | an `ArrayBuffer` |

Declare or import your own `Date` and the schema uses yours instead -
so a type named after one of these replaces the runtime check, by design.
[Response types&nbsp;›](/validation/response)

## Names That Do Not Resolve

A name with no declaration the route can reach - a typo, a type from a file that was moved,
a type built from a value with `typeof` - cannot become a schema.
KosmoJS reports it when the route is built, naming the route and the type,
and the route's validators refuse to load until it resolves.
[Details&nbsp;›](/validation/gotchas#a-type-that-does-not-resolve)
