---
title: React - Loader Pattern
description: Implement React Router's loader pattern for data prefetching.
    Export loader functions that work with useLoaderData for type-safe
    data availability before component rendering.
head:
  - - meta
    - name: keywords
      content: react router loaders, data prefetching, useLoaderData hook,
        route data loading, react data patterns, loader functions, async
        loading react, react router data
---

React Router's loader pattern ensures data is ready before components render.
You define what data a route needs, and the router handles fetching it during navigation.

First, create an API endpoint that provides the data,
eg.: `api/users/data/index.ts`:

```ts [api/users/data/index.ts]
import { defineRoute } from "_/front/api/users/data";

export default defineRoute(({ GET }) => [
  GET<never, Data>(async (ctx) => {
    // Fetch data from database or external API
    ctx.body = await fetchUserData();
  }),
]);
```

In your page component, import the fetch client's GET method
and use it both for the loader export and for accessing the data in your component:

```tsx [pages/users/index.tsx]
import { useLoaderData } from "react-router";
import { GET, type ResponseT } from "_/front/fetch/users/data";

export { GET as loader };

export default function Page() {
  const data = useLoaderData<ResponseT["GET"]>();

  return (
    <div>
      {data && <UserList users={data.users} />}
    </div>
  );
}
```

This pattern is elegant in its simplicity.

The `loader` export tells the router what function to call for prefetching.
When your component renders, `useLoaderData` retrieves the data
that was already fetched by the loader.

The router's internal caching means you're not making duplicate requests -
the data fetched during the loader phase is the data your component receives.

The type safety flows through this entire chain.
The fetch client's GET method is typed based on your API endpoint's response type.

`useLoaderData` can be typed with the response type from the fetch client.
Your component knows exactly what shape of data to expect,
all derived from your API definition.

For more details on React Router's loader pattern,
see the [React Router documentation](https://reactrouter.com/start/data/data-loading).
