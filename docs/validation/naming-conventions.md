---
title: Validation Naming Conventions
description: Avoid TypeScript built-in type names when defining types for validation.
    Use suffix T or prefix T conventions to prevent runtime validation failures.
head:
  - - meta
    - name: keywords
      content: naming conventions, type naming, built-in types, naming conflicts,
        EventT, ResponseT, validation types, typescript conventions
---

Avoid naming your types after TypeScript/JavaScript built-ins like `Event`, `Response`, `Request`, or `Error`.
These names compile fine, but cause silent failures during runtime validation.

## ⚠️ Why This Matters

When `KosmoJS` flattens types for schema generation, built-in names are referenced as-is
rather than resolved to your custom definition. The validator sees the built-in, not your type,
and validation fails at runtime without a compile-time warning.

```ts
// ❌ Compiles fine, breaks at runtime
type Event = { id: number; name: string; timestamp: string };

// ✅ Works correctly
type EventT = { id: number; name: string; timestamp: string };
type TEvent = { id: number; name: string; timestamp: string }; // also fine
```

Use a consistent `T` suffix (`EventT`, `ResponseT`) or prefix (`TEvent`, `TResponse`) throughout your project.
If validation fails unexpectedly despite correct type definitions, a naming conflict is the first thing to check.

## 📋 Common Built-ins to Avoid

**DOM:** `Event`, `Element`, `Document`, `Window`, `Node`, `HTMLElement`, `EventTarget`, `CustomEvent`

**Web APIs:** `Response`, `Request`, `Headers`, `Body`, `Blob`, `File`, `FormData`, `URLSearchParams`, `WebSocket`

**JavaScript:** `Error`, `Date`, `RegExp`, `Promise`, `Symbol`, `Map`, `Set`, `Array`, `Object`, `String`, `Number`

**TypeScript utilities:** `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`

**Node.js:** `Buffer`, `Stream`, `EventEmitter`, `Timeout`

For the full list, see the [TFusion builtins reference](https://github.com/sleewoo/tfusion/blob/main/src/builtins.ts).
