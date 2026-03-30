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

When you define an API route with typed parameters, payloads, and responses,
`KosmoJS` generates a corresponding fetch client - automatically, as part of the same build step.

The result is a fully-typed client that mirrors your route definition exactly.
Parameters, payload shape, response type - all derived from the same source.
Change your API, and the client updates with it. No manual sync required.

## 🤖 What Gets Generated

Each route's client module exports:

🔹 **HTTP method functions** - `GET`, `POST`, `PUT`, etc., accepting parameters and payloads
typed to match your route definition and returning typed response promises.
([Details ➜ ](/fetch/start))

🔹 **`path` and `href` utilities** - construct relative or absolute URLs with proper
parameter substitution and optional query string support.
([Details ➜ ](/fetch/utilities))

🔹 **`validationSchemas`** - the same schemas used for server-side validation,
exposed for client-side form validation with `check`, `errors`, `errorMessage`,
`errorSummary`, and `validate` methods.
([Details ➜ ](/fetch/validation))

## 🏗️ Using the Generated Client

Import the fetch map and pick the client for your route by path:

```ts [pages/example/index.tsx]
import fetchClients from "_/fetch";

const response = await fetchClients["users/[id]"].GET([123]);
```

The generator places its output in the `lib` directory alongside other generated artifacts
(validation routines, OpenAPI spec). Everything is updated automatically in the background
as you modify routes during development.
