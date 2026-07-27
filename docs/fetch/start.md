---
title: Getting Started with Fetch Client
description: Import and use KosmoJS generated fetch clients with full TypeScript typing.
    Access routes directly or through a centralized map with automatic parameter and payload validation.
head:
  - - meta
    - name: keywords
      content: fetch client, typed fetch, api client, http methods, route parameters,
        payload typing, response types, typescript api client
---

The fetch index exports a map of route paths to their generated clients:

```ts [pages/example/index.tsx]
import fetchClients from "_/fetch";

const response = await fetchClients["users/[id]"].GET([123]);
```

## Method Signatures

Each client exposes methods for the HTTP verbs your route handles.
The signature reflects your route definition directly:
- First argument is a parameter array, in path order
- Second argument is the payload, if your handler defines one

Given this route:

```ts [api/users/[id]/index.ts]
export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET<{
    query: { name?: string },
    response: [200, "json", { id: number; name: string; email: string }],
  }>(async (ctx) => { /* ... */ }),
]);
```

The generated client expects a number parameter and an optional payload:

```ts [pages/example/index.tsx]
const useFetch = fetchClients["users/[id]"];

const response = await useFetch.GET([123]);
const response = await useFetch.GET([123], { query: { name: "John" } });
// response is typed as { id: number; name: string; email: string }
```

## Routes Without Parameters or Payloads

No parameters, no array:

```ts
const response = await fetchClients["users"].GET();
```

If there is a payload to send without params, just use an empty array for params:

```ts
const response = await fetchClients["users"].GET([], {
  query: { filter: "active", page: 1 }
});
```

If the route defines no payload type (or `never`), the second argument is not required.
The client adapts to exactly what your API expects - passing the wrong shape is a type error.

## Isomorphic Fetch

The same call works in CSR and SSR without changes. In the browser it issues a same-origin
network request; during SSR it dispatches to the API route in-process - the API server is
bundled into the SSR bundle, so there's no network hop, just a direct call through the full
middleware/validation/handler chain.

```ts [pages/example/index.tsx]
// identical in a client component and in an SSR loader
const response = await fetchClients["users/[id]"].GET([123]);
```

Nothing to configure - no separate server-side client, no base URL for the in-process path.
The `path`/`href` utilities still produce URL strings for links and external references (see
[Path Utilities](/fetch/utilities)); it's the request methods (`GET`, `POST`, ...) that swap
transport on the server.
