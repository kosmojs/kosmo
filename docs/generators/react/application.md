---
title: React - Application Foundation
description: Generator-produced React files including App.tsx with Suspense,
  router.tsx connecting React Router, and entry/client.tsx with StrictMode for
  DOM rendering initiation.
head:
  - - meta
    - name: keywords
      content: react app foundation, suspense setup, react router integration,
        createRoot hydration, app entry point, vite react entry, react project
        structure, strictmode setup
---

The `React` generator automates foundational file creation, establishing routing
infrastructure and application structure. This includes router integration,
type-safe navigation components, and lazy-loaded route definitions forming a
production-ready foundation.

## 🎨 Root Application Component

The generator creates `App.tsx` as your application's root wrapper, providing
React's Suspense boundary:

```tsx [App.tsx]
import { Suspense, type ReactNode } from "react";

export default function App({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}
```

This component forms your application shell. The Suspense boundary enables
child components to suspend during asynchronous operations like data fetching,
displaying fallback content until resources become available.

Customize this component for global layouts, error boundaries, or
application-wide infrastructure concerns.

## 🛣️ Router Integration

The `router.tsx` file bridges `KosmoJS`'s generated routes with `React` Router:

```tsx [router.tsx]
import {
  createBrowserRouter,
  createStaticRouter,
  Outlet,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import { routes } from "@src/{react}";

import App from "./App";
import { baseurl } from "./config";

export const routeStack = [
  {
    path: "/",
    element: (
      <App>
        <Outlet />
      </App>
    ),
    HydrateFallback: () => <div>Loading...</div>,
    children: routes,
  },
];

export default function AppRouter(ssrProps?: { context?: never }) {
  if (ssrProps?.context) {
    const router = createStaticRouter(routeStack, ssrProps.context);
    return <StaticRouterProvider router={router} context={ssrProps.context} />;
  }
  const router = createBrowserRouter(routeStack, { basename: baseurl });
  return <RouterProvider router={router} />;
}
```

This configuration utilizes your source folder's `baseurl` from configuration
files, ensuring correct path-based route serving.

The `routes` import originates from generated code within your `lib`
directory, explored in subsequent sections.

Router configuration wraps all routes within your App component, rendering
every route inside the App's Suspense boundary.

## 🎯 Application Entry

The `entry/client.tsx` file serves as your application's DOM rendering entry
point:

```tsx [entry/client.tsx]
import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";

import { shouldHydrate } from "@src/{react}";
import Router from "../router";

const root = document.getElementById("app");

if (root) {
  if (shouldHydrate) {
    hydrateRoot(
      root,
      <StrictMode>
        <Router />
      </StrictMode>,
    );
  } else {
    createRoot(root).render(
      <StrictMode>
        <Router />
      </StrictMode>,
    );
  }
} else {
  console.error("Root element not found!");
}
```

Your `index.html` file references this entry point, created during source
folder initialization:

```html
<script type="module" src="./entry/client.tsx"></script>
```

The `index.html` file serves as Vite's processing entry point. `Vite` begins
from this HTML file, follows the script import to `entry/client.tsx`, and
constructs your complete application graph from there.
