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

One of most compelling `KosmoJS` feature is the approach to validation.

It's called "runtype" validation - your types are automatically converted into JSON Schema and validated at runtime.

Rather than learn and maintain separate schema definition languages,
you can express validation rules directly in `TypeScript`.

Your types serve as source of truth for:
- runtime validation on the server
- client-side validated type-safe fetch clients
- OpenAPI 3.1 specification

<div class="text-center">
  <LinkButton href="/validation/payload">Get Started</LinkButton>
</div>

## 🛡️ Understanding Runtype Validation

By default, when you provide type annotations to your route parameters, payloads, and responses,
those annotations provide compile-time type checking through `TypeScript`.

Your editor gives you autocomplete, catches type errors before you run your code, and helps you refactor safely.

However, these compile-time checks don't protect you at runtime.
When actual HTTP requests arrive with unpredictable data from the outside world,
`TypeScript` can't help you - it only exists during development and compilation.

This is where runtype validation comes in.
The same type definitions that give you compile-time safety
also generate validation logic that runs when requests arrive,
ensuring that the data actually matches what your types promise.

## 🔄 The Power of End-to-End Validation

Being end-to-end, runtype validation happens at both ends:
the client validates before sending requests,
and the server validates before processing them.

That means fetch clients actively validates request data on the client side
before sending anything to the server.
If validation fails, the client throws an error immediately without making a network request.

This client-side validation uses exactly the same schemas that validate on the server,
ensuring perfect consistency between what the client considers valid and what the server accepts.

And no, double validation is not a performance hit. Actually, it improves performance -
invalid requests never reach your server, saving network bandwidth and server resources.

For high-traffic APIs, this client-side validation can reduce the number of requests
your servers need to process. Users also get faster feedback when they make mistakes,
since validation errors appear instantly without waiting for a round trip to the server.

<div class="text-center">
  <LinkButton href="/validation/payload">Get Started</LinkButton>
</div>

## 🔍 Understanding the Generated Validation Code

For runtype validation to work seamlessly, `KosmoJS` uses AST parsing to extract types from your route files,
then AOT compilation to generate high-performance validation routines in your `lib` directory.

You don't need to understand the generated code to use validation -
`KosmoJS` integrates it into the request processing pipeline automatically.

However, understanding what happens under the hood can help you reason about performance characteristics
and troubleshoot issues if they arise.

For each validated type, `Typebox` used to produce a JSON Schema and a compiled validator function.
The validator function is highly optimized -
it doesn't use generic validation logic that checks every possible JSON Schema keyword.

Instead, it's specifically tailored to validate the exact structure you defined,
with direct property checks and minimal overhead.

This compilation approach means validation is fast enough for production use.
The performance overhead of validation is typically negligible compared to other parts of request processing
like parsing, database queries, or business logic.
For most applications, the benefits of guaranteed data correctness far outweigh any performance cost.

The generated validation code lives in `lib` rather than in your source directories,
keeping your code focused on business logic.
When you build for production, this generated code is included in the bundle just like any other dependency.
