---
title: Application Structure
description: Generator-produced foundation files for React, SolidJS, and Vue applications -
  root App component, router configuration via routerFactory, and client entry
  point with SSR hydration support via renderFactory.
head:
  - - meta
    - name: keywords
      content: react app foundation, solidjs app structure, vue application structure,
        routerFactory, renderFactory, suspense setup, router integration, createRoot
        hydration, app entry point, vite entry, strictmode setup, solidjs router,
        vue router, react router, kosmojs framework
---

Each framework generator produces a small set of foundation files that wire up
routing, navigation, and application bootstrap. The structure is consistent
across frameworks: a root App component, a router configuration, and a client
entry point.

## 🎨 Root Application Component

The generator creates a minimal root component as your application shell.
Extend it with global layouts, error boundaries, authentication providers, or
other application-wide concerns.

::: code-group

```tsx [React · App.tsx]
import { Outlet } from "react-router";

export default function App() {
  return <Outlet />;
}
```

```tsx [SolidJS · App.tsx]
import type { ParentComponent } from "solid-js";

const App: ParentComponent = (props) => {
  return props.children;
};

export default App;
```

```vue [Vue · App.vue]
<template>
  <RouterView />
</template>
```

:::

## 🛣️ Router Configuration

The `routerFactory` function connects your root App component and generated
routes to the framework's native router. It accepts a callback receiving:

- `App` - your root component
- `routes` - auto-generated route definitions from `KosmoJS`

The callback must return two functions:

- `clientRouter()` - browser-based routing for client-side navigation
- `serverRouter({ url })` - server-side routing for SSR, receiving the
  requested URL

::: code-group

```tsx [React · router.tsx]
import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import { routerFactory } from "_/router";
import { baseurl } from "./config";

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
        throw result; // handled by SSR server
      }

      const router = createStaticRouter(routeStack, result);
      return <StaticRouterProvider router={router} context={result} />;
    },
  };
});
```

```tsx [SolidJS · router.tsx]
import { Router } from "@solidjs/router";

import { routerFactory } from "_/router";
import { baseurl } from "./config";

export default routerFactory((App, routes) => {
  return {
    clientRouter() {
      return (
        <Router root={App} base={baseurl}>
          {routes}
        </Router>
      );
    },
    serverRouter({ url }) {
      return (
        <Router root={App} base={baseurl} url={url.pathname}>
          {routes}
        </Router>
      );
    },
  };
});
```

```ts [Vue · router.ts]
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";

import { routerFactory } from "_/router";
import { baseurl } from "./config";

export default routerFactory((app, routes) => {
  return {
    clientRouter() {
      const router = createRouter({
        history: createWebHistory(baseurl),
        routes,
        strict: true,
      });
      app.use(router);
      return router;
    },
    async serverRouter({ url }) {
      const router = createRouter({
        history: createMemoryHistory(baseurl),
        routes,
        strict: true,
      });
      await router.push(url.pathname);
      await router.isReady();
      app.use(router);
      return router;
    },
  };
});
```

:::

All three use your source folder's `baseurl` config for correct path-based
routing. The generated `routes` are always wrapped inside your `App` component,
establishing the layout hierarchy.

React uses `createStaticHandler` and `createStaticRouter` for server rendering.
SolidJS simply passes the `url.pathname` prop to the shared `<Router>`.
Vue switches from `createWebHistory` to `createMemoryHistory` for SSR and
awaits `router.isReady()` before rendering.

## 🎯 Application Entry

The `entry/client` file is your application's DOM rendering entry point,
referenced from `index.html`:

```html
<script type="module" src="./entry/client.tsx"></script>
```

Vite begins from this HTML file, follows the import to `entry/client`, and
constructs the complete application dependency graph from there.

The `renderFactory` function orchestrates two rendering modes via a callback
that must return:

- `clientRender()` - mounts the application fresh in the browser
- `serverRender()` - hydrates pre-rendered server HTML for interactivity

During SSR builds, the generator embeds an `ssrMode` flag directly into the
client bundle. On page load, `renderFactory` reads this flag to select the
correct path: `serverRender()` for SSR hydration, `clientRender()` for a
fresh client-only mount.

::: code-group

```tsx [React · entry/client.tsx]
import { hydrateRoot, createRoot } from "react-dom/client";

import { renderFactory, createRoutes } from "_/entry/client";
import App from "../App";
import createRouter from "../router";

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
    };
  });
} else {
  console.error("Root element not found!");
}
```

```tsx [SolidJS · entry/client.tsx]
import { hydrate, render } from "solid-js/web";

import { renderFactory, createRoutes } from "_/entry/client";
import App from "../App";
import createRouter from "../router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes({ withPreload: true });
  renderFactory(async () => {
    const router = await createRouter(App, routes);
    return {
      clientRender() {
        render(() => router, root);
      },
      serverRender() {
        hydrate(() => router, root);
      },
    };
  });
} else {
  console.error("Root element not found!");
}
```

```ts [Vue · entry/client.ts]
import { createApp, createSSRApp } from "vue";

import { renderFactory, createRoutes } from "_/entry/client";
import App from "../App.vue";
import createRouter from "../router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes();
  renderFactory(async () => {
    return {
      async clientRender() {
        const app = createApp(App);
        await createRouter(app, routes);
        app.mount(root);
      },
      async serverRender() {
        const app = createSSRApp(App);
        await createRouter(app, routes);
        app.mount(root, true);
      },
    };
  });
} else {
  console.error("Root element not found!");
}
```

:::

React uses `createRoot`/`hydrateRoot` from `react-dom/client`. SolidJS uses
`render`/`hydrate` from `solid-js/web`. Vue constructs separate app instances
via `createApp` and `createSSRApp`, mounting with the hydration flag on the
SSR path.
