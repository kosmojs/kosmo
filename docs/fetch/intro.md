---
title: Generated Fetch Clients
description: KosmoJS automatically generates fully-typed fetch clients with runtime validation for every API route.
    End-to-end type safety from frontend to backend with validation schemas and URL utilities.
head:
  - - meta
    - name: keywords
      content: generated fetch client, typed api client, runtime validation, type safety,
        fetch generator, api consumption, validation schemas, url utilities
---

`KosmoJS` automatically generates a fully-typed fetch client for every API route,
creating a seamless bridge between your backend API definitions and frontend consumption.

This generated client delivers end-to-end type safety from frontend code to backend handlers,
complete with runtime validation that catches errors before requests reach the server.

## 🤖 Understanding the Generated Client

When you define API routes with typed parameters, payloads, and responses,
`KosmoJS` generates corresponding fetch clients that mirror this structure exactly.

The generator runs alongside other generators like the validation generator,
placing its output in the lib directory alongside other generated artifacts.

Each route's client module exports:

🔹 HTTP method functions corresponding to your route's handlers

🔹 Utility functions for URL construction

🔹 Validation schemas for client-side validation

🔹 Full `TypeScript` types derived from your API route definitions

The client understands your complete API structure - parameters, payload requirements, response shapes -
and provides this intelligence through both `TypeScript`'s type system and runtime validation checks,
ensuring your frontend and backend remain perfectly synchronized.

This eliminates the traditional friction between API definition and consumption,
letting you work with your API as if it were local functions while maintaining all the safety guarantees of runtime validation.

## 🏗️ The Complete Generated Client Structure

While you typically interact with the fetch client through its exported methods,
understanding its complete structure helps you make the most of its capabilities.

Each generated fetch client exports:

**HTTP method functions** corresponding to the methods your API route handles (GET, POST, PUT, DELETE, etc.).
([Details ➜ ](/fetch/start))

Each function accepts parameters and payload according to your type definitions
and returns a typed promise for the response.

**The `path` utility function** for constructing relative URLs with proper parameter handling
and optional query string support.
([Details ➜ ](/fetch/utilities))

**The `href` utility function** for constructing absolute URLs with host, parameters, and query strings.
([Details ➜ ](/fetch/utilities))

**The `validationSchemas` object** containing validation schemas for parameters, payloads and responses,
organized by HTTP method.

Each schema provides `check`, `errors`, `errorMessage`, `errorSummary`, and `validate` methods.
([Details ➜ ](/fetch/validation))
