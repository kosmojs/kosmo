---
title: Data Loading with React Router
description: Implement React Router's loader pattern for pre-fetch data
  delivery. Export loader functions working with useLoaderData for optimized
  data availability before component render.
head:
  - - meta
    - name: keywords
      content: react router loaders, data prefetching, useLoaderData hook,
        route data loading, react data patterns, loader functions, async
        loading react, react router data
---

`React Router`'s loader pattern synchronizes data availability with navigation,
ensuring information readiness when components mount. Define required data at
the route level, letting the router handle fetch orchestration.

Begin by establishing an API endpoint supplying the required data. Consider
`api/users/data/index.ts`:

```ts [api/users/data/index.ts]
import { defineRoute } from "@front/{api}/users/data";

export default defineRoute(({ GET }) => [
  GET<never, Data>(async (ctx) => {
    // Fetch data from database or external API
    ctx.body = await fetchUserData();
  }),
]);
```

Within your page component, import the fetch client's GET method, utilizing
it for both loading export and component data access:

```tsx [pages/users/index.tsx]
import { useLoaderData } from "react-router-dom";
import { GET as fetchData } from "@front/{api}/users/data/fetch";

export default function Page() {
  // useLoaderData recognizes that fetchData is the same function from loader
  // and reuses the fetched data instead of fetching again
  const data = useLoaderData();

  return (
    <div>
      {data && <UserList users={data.users} />}
    </div>
  );
}

// Export the fetch function as loader
export const loader = fetchData;
```

This pattern achieves elegance through simplicity.

Exporting a `loader` function instructs the router which fetch logic executes
ahead of component mount. During render, `useLoaderData` recognizes this
identical function reference and retrieves pre-fetched information directly
from the router's cache.

The router's internal caching mechanism prevents redundant network requests,
guaranteeing your component receives the exact dataset acquired during the
pre-fetch phase.

Type consistency flows through this entire pipeline automatically. The fetch
client's GET method inherits typing from your API endpoint's response
structure. The `useLoaderData` hook derives its return type from the loader
function's signature. Your component consequently receives precise type
information about data shape, all originating from your API specification
without manual type declarations.
