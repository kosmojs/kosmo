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

The fetch index exports a default object that maps route paths to their corresponding clients:

```ts [pages/example/index.tsx]
// import fetch clients
import fetchClients from "_/front/fetch";

// Pick needed client by route name
const response = await fetchClients["users/[id]"].GET([123]);
```

### 🚀 Using the Fetch Client Methods

The fetch client exports methods for each HTTP verb your API route handles.

If your route defines GET, POST, and PUT handlers, the client exports GET, POST, and PUT functions.

These functions accept parameters and payloads according to the types you specified in your route definition.

The method signature adapts to your route's requirements. If your route has parameters,
the first argument is an array of parameter values in the order they appear in the route path.

If your route's handler defines a payload type, the second argument accepts payload data.

Both arguments are typed according to your API definition, so `TypeScript` guides you toward correct usage.

Consider an API route with a typed parameter and payload:

```ts [api/users/[id]/index.ts]
// API route definition
import { defineRoute } from "_/front/api";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET<{
    json: { name?: string },
    response: [200, "json", { id: number; name: string; email: string }],
  }>(async (ctx) => {
    // Handler implementation
  }),
]);
```

The generated fetch client for this route expects a number parameter and optional payload:

```ts [pages/example/index.tsx]
import fetchClients from "_/front/fetch";

const useFetch = fetchClients["users/[id]"]

// Call with just parameters
const response = await useFetch.GET([123]);

// Call with parameters and payload
const response = await useFetch.GET([123], { json: { name: "John" } });
```

The `response` variable is typed as `{ id: number; name: string; email: string }`
because that's what your API route declared as its response body.

`TypeScript` ensures you handle the response correctly, and when validation is enabled,
runtime checks ensure the response actually matches this structure.

### 📭 Routes Without Parameters or Payloads

Not all routes need parameters or payloads. A route at `api/users/index.ts`
with no parameters and no payload or response types can be called without arguments:

```ts
import fetchClients from "_/front/fetch";

const response = await fetchClients["users"].GET();
```

If the route defines a payload type but you're using a method like GET that typically doesn't send a body,
you still provide the payload argument. The generated client handles translating this into query parameters:

```ts
// GET with query parameters
const response = await fetchClients["users"].GET([], { filter: "active", page: 1 });
```

If a route defines no payload type or explicitly uses `never` as the payload type,
the fetch method doesn't require the second argument.

The generated client adapts to exactly what your API expects,
making it impossible to call endpoints incorrectly.
