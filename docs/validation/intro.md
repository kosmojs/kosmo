---
title: Runtime Validation
description: KosmoJS runtype validation automatically converts TypeScript types into JSON Schema
    with runtime validators. Write types once, get compile-time and runtime safety without schema duplication.
head:
  - - meta
    - name: keywords
      content: runtime validation, typebox, json schema, runtype validation,
        typescript validation, type safety, validation generator, end-to-end validation
---

`KosmoJS` uses the "runtype" validation approach - your `TypeScript` types are automatically
converted into JSON Schema and validated at runtime.

No separate schema language to learn. No schemas drifting out of sync with your types.
One type definition becomes the source of truth for:
- runtime validation on the server
- client-side validation in generated fetch clients
- OpenAPI 3.1 specification

<div class="text-center">
  <LinkButton href="/validation/payload">Get Started</LinkButton>
</div>

## 🛡️ Understanding Runtype Validation

When you provide type annotations to your route parameters, payloads, and responses,
`TypeScript` gives you compile-time checking - autocomplete, refactoring safety, and error detection before you run your code.

But compile-time checks don't protect you at runtime.
When actual HTTP requests arrive with unpredictable data from the outside world,
`TypeScript` is no longer in the picture.

Runtype validation closes this gap.
The same type definitions that give you compile-time safety
also generate validation logic that runs when requests arrive,
ensuring that incoming data actually matches what your types promise.

## 🔄 End-to-End Validation

Runtype validation happens at both ends:
the client validates before sending requests,
and the server validates before processing them.

Generated fetch clients validate request data on the client side before making any network request.
If validation fails, the client throws immediately - no round trip needed.

This uses the exact same schemas that validate on the server,
so what the client considers valid and what the server accepts are always in sync.

Double validation is not a performance cost - it's a performance gain.
Invalid requests never reach your server, saving bandwidth and compute.
Users also get instant feedback instead of waiting for a server response.

<div class="text-center">
  <LinkButton href="/validation/payload">Get Started</LinkButton>
</div>

## 🔍 How Generation Works

`KosmoJS` uses AST parsing to extract types from your route files,
then AOT compilation to generate high-performance validation routines in your `lib` directory.

For each validated type, [TypeBox](https://github.com/sinclairzx81/typebox) produces a JSON Schema
and a compiled validator function tailored specifically to that structure -
direct property checks with minimal overhead, not a generic JSON Schema interpreter.

The generated code lives in `lib`, keeping your source directories focused on business logic.
At production build time it's bundled like any other dependency.

You don't need to read or understand the generated code to use validation.
If you're curious about performance characteristics or need to troubleshoot,
see [Validation Performance](/validation/performance).
