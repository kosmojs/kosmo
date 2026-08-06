---
title: Fetch Client Type Safety
description: Generated fetch clients are fully typed - parameters, payload, and response all
    mirror the backend route. Access response types on the client with the ResponseT map.
head:
  - - meta
    - name: keywords
      content: fetch type safety, ResponseT, typed response, response type, end-to-end types,
        typed api client, type inference, useLoaderData types, createAsync types
---

The generated fetch client mirrors your backend route exactly.
Parameters, payload, and response are all typed from the same route definition -
change the route, and every call site updates with it.

Parameters and payload are checked the moment you call a method: the signature expects the
parameter array and payload shape your route declares, and passing the wrong thing is a
compile error. Nothing to import, nothing to annotate.

```ts [pages/example/index.tsx]
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

await GET([123]);                      // ✅ number param, as declared
await GET(["abc"]);                    // ❌ type error - param must be a number
await GET([123], { query: { q: 1 } }); // ❌ type error - `q` isn't in the query type
```

## Response Types

The response is fully typed at the call site too - awaiting `GET(...)` gives you a value typed
to that route's response, no annotation needed. So most of the time you never name the response
type at all; you just use the result.

What you occasionally need is the response type *out of band* - away from the call,
where there's no awaited result to infer from. Typing a Solid `createAsync` accessor,
a `useLoaderData()` result, a store, a component prop, or a shared helper are the common cases.

For those, `KosmoJS` generates a `ResponseT` map, exported from `_/fetch`.

`ResponseT` is keyed by route name, then request method, and resolves to the response **body**
type declared on that handler - the same type awaiting the method gives you, available as a
name you can reference anywhere.

Given this backend route:

```ts [api/users/[id]/index.ts]
export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET<{
    query: { name?: string },
    response: [200, "json", { id: number; name: string; email: string }],
  }>(async (ctx) => { /* ... */ }),
]);
```

the response type is available on the client as:

```ts [pages/example/index.tsx]
import f, { type ResponseT } from "_/fetch";

ResponseT["users/[id]"]["GET"]; // { id: number; name: string; email: string }
```

::: tip Response types are opt-in
An entry exists in `ResponseT` only when the handler declares a `response`.
If a route defines no response type, it has no `ResponseT` entry -
just as it has no response validation. Declare a `response` to get both.
:::

## Multiple Responses

A handler can declare a union of responses - different status codes returning different bodies.
`ResponseT` follows, collapsing to a union of the body types:

```ts [api/users/index.ts]
export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: NewUser,
    response:
      | [201, "json", User]             // created - full record
      | [202, "json", { queued: true }] // accepted for async processing
      | [409]                           // conflict, no body
  }>(async (ctx) => {
    // response must comply with one of the defined schemas
  }),
]);
```

Variants without a body - no third tuple element, like the bare `[409]` above -
contribute nothing to the type, so they drop out of the union:

```ts [pages/example/index.tsx]
import f, { type ResponseT } from "_/fetch";

ResponseT["users"]["POST"]; // User | { queued: true }
```

## Using Response Types

The out-of-band cases in practice, e.g. React's `useLoaderData()` annotated at its untyped boundary,
and a shared helper naming the type once:

::: code-group

```tsx [React]
import { useLoaderData } from "react-router";
import f, { type ResponseT } from "_/fetch";

const { GET } = f["users/[id]"];

export const loader = ({ params }) => GET([params.id]);

export default function UserProfile() {
  // useLoaderData is untyped at the boundary - annotate it with ResponseT
  const user = useLoaderData<ResponseT["users/[id]"]["GET"]>();
  return <div>{user.name}</div>;
}
```

```ts [helpers.ts]
import f, { type ResponseT } from "_/fetch";

// name the type once, reuse it across components
type User = ResponseT["users/[id]"]["GET"];

function formatUser(user: User) {
  return `${user.name} <${user.email}>`;
}
```
:::

The type flows from the backend route through the client to wherever you consume it.
Change the route's `response` shape and every consumer - loaders, resources, helpers, props -
updates with it, surfacing mismatches at compile time instead of in production.

See [Fetch Client Integration](/fetch/integration) for the full set of framework patterns,
and [Response Validation](/validation/response) for declaring the `response` schema on the
backend.
