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

The generator creates a minimal `App.tsx` as your application's root wrapper:

```tsx [App.tsx]
import { Outlet } from "react-router";

export default function App() {
  return <Outlet />;
}
```

Customize this component to your needs - add global layouts, error boundaries,
or other application-wide concerns.

## 🛣️ Router Integration

The `router.tsx` file bridges `KosmoJS`'s generated routes with `React` Router using the `routerFactory` function.

`routerFactory` takes a callback that receives two arguments:
- `App` - Your root App component
- `routes` - Generated route definitions from `KosmoJS`

The callback must return an object with two functions:
- `clientRouter()` - Creates a browser router for client-side navigation
- `serverRouter({ url })` - Creates a static router for server-side rendering

```tsx [router.tsx]
import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import { routerFactory } from "_/front/router";
import { baseurl } from "@/front/config";

export default routerFactory((App, routes) => {
  const routeStack = [
    {
      path: "/",
      Component: App,
      children: routes,
    },
  ];

  return {
    clientRouter() {
      const router = createBrowserRouter(routeStack, { basename: baseurl });
      return <RouterProvider router={router} />;
    },
    async serverRouter({ url }) {
      const handler = createStaticHandler(routeStack, { basename: baseurl });

      const result = await handler.query(new Request(url.href));

      if (result instanceof Response) {
        // handled by SSR server
        throw result;
      }

      const router = createStaticRouter(routeStack, result);

      return <StaticRouterProvider router={router} context={result} />;
    },
  };
});
```

**Key points:**

- `clientRouter()` uses `createBrowserRouter` for in-browser navigation with full interactivity
- `serverRouter({ url })` uses `createStaticHandler` and `createStaticRouter` to render pages on the server during SSR
- Both use your source folder's `baseurl` configuration for correct path-based routing
- The `routeStack` wraps generated routes inside your `App` component, establishing the layout hierarchy

This pattern separates client and server routing concerns while sharing the same route definitions and App wrapper.

## 🎯 Application Entry

The `entry/client.tsx` file serves as your application's DOM rendering entry point.
It uses `renderFactory` function that orchestrates client-side rendering with SSR hydration support.

It takes a callback that must return an object with two functions:
- `clientRender()` - Renders the app from scratch in the browser (no SSR)
- `serverRender()` - Hydrates server-rendered HTML to make it interactive

```tsx [entry/client.tsx]
import { hydrateRoot, createRoot } from "react-dom/client";

import { renderFactory, createRoutes } from "_/front/entry/client";
import App from "@/front/App";
import createRouter from "@/front/router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes({ withPreload: true });
  renderFactory(async () => {
    const router = await createRouter(App, routes);
    return {
      clientRender() {
        createRoot(root).render(router);
      },
      serverRender() {
        hydrateRoot(root, router);
      },
    }
  });
} else {
  console.error("Root element not found!");
}
```

**How it works:**

During SSR builds, the generator embeds an `ssrMode` flag directly into your client bundle.
This bundled flag provides definitive runtime detection - your client code has explicit knowledge of its rendering context.
At page load, `renderFactory` reads this embedded flag for mode selection:

- `ssrMode` set to true (SSR bundle) - `serverRender()` engages for hydrating pre-rendered markup
- `ssrMode` set to false (client bundle) - `clientRender()` performs a fresh mount

Both functions exist in your code; `renderFactory` chooses between them using the compile-time flag.

Your `index.html` file references this entry point, created during source folder initialization:

```html
<script type="module" src="./entry/client.tsx"></script>
```

The `index.html` file serves as Vite's processing entry point.
`Vite` begins from this HTML file, follows the script import to `entry/client.tsx`,
and constructs your complete application graph from there.
