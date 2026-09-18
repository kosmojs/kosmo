---
title: React frontend
description: Everything specific to a React frontend folder - the loader export,
    reading data through react-router, layouts with Outlet, and why _/use does not exist.
head:
  - - meta
    - name: keywords
      content: react, kosmojs react, react-router, useLoaderData, Outlet, loader export,
        layout.tsx, ErrorBoundary, no _/use in react
---

A folder with `frontend: { stack: "react" }`. Pages are `.tsx`, layouts are `layout.tsx`.
Routing, fetch clients and validation behave the same for every frontend.
[Frontend&nbsp;intro&nbsp;›](/frontend/intro.md)

## `_/use` does not exist here

This is the React-specific trap. `_/use` is derived **only for Vue, Svelte and MDX**
folders - in a React folder the import does not resolve at all. Everything comes
from `react-router`:

| Need | React |
|---|---|
| loader data | `useLoaderData()` from `react-router` |
| route params | `useParams()` from `react-router` |
| navigate | `useNavigate()` from `react-router` |

## The loader

A page exports `loader`, and React Router runs it at initial load, on link hover
and on navigation - so the data is there before the component renders:

```tsx [pages/users/[id]/index.tsx]
// React: pages/users/[id]/index.tsx
import { useLoaderData } from "react-router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);

export default function UserProfile() {
  // useLoaderData is untyped at the boundary - annotate it
  const user = useLoaderData<User>();
  return <div>{user.name}</div>;
}
```

`useLoaderData()` is the one place a type annotation is needed; everywhere else the
fetch client's return type flows through.

## Layouts

```tsx [layout.tsx]
// React: layout.tsx
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="dashboard">
      <nav>...</nav>
      <main>
        <Outlet />
      </main>
      <footer>...</footer>
    </div>
  );
}
```

Child routes render through `<Outlet />`, not through `props.children`.
Each route owns its own `loader`, so a layout's data and its page's data stay
distinct structurally - no key to pass.

## Worth knowing

- Loaders resolve before render, so route-level data needs no `<Suspense>` boundary.
That is a SolidJS concern.
- Streaming SSR is available for React, alongside SolidJS and Vue.
- The default plugin is `@vitejs/plugin-react`. Pass your own through
`stack: { name: "react", plugin: react({ ... }) }`, never through `viteConfig.plugins`.
[Configuration&nbsp;›](/essentials/config.md#frontend-stack-required)
