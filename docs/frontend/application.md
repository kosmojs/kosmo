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
routes to the framework's native router.
It accepts a callback receiving auto-generated route definitions from `KosmoJS`.

The callback must return two functions:

- `clientRouter()` - browser-based routing for client-side navigation
- `serverRouter(url)` - server-side routing for SSR, receiving the requested URL

::: code-group

```tsx [React · router.tsx]
import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import app from "./App";

import { baseurl } from "~/config";
import { routerFactory } from "_/router";

export default routerFactory((routes) => {
  const routeStack = [
    {
      path: "/",
      Component: app,
      children: routes,
    },
  ];

  const handler = createStaticHandler(routeStack, { basename: baseurl });

  return {
    async clientRouter() {
      const router = createBrowserRouter(routeStack, { basename: baseurl });
      return {
        router: <RouterProvider router={router} />,
        app,
      };
    },
    async serverRouter(url) {
      const context = await handler.query(new Request(url.href));

      if (context instanceof Response) {
        // handled by SSR server
        throw context;
      }

      const router = createStaticRouter(routeStack, context);

      return {
        router: <StaticRouterProvider router={router} context={context} />,
        app,
      };
    },
  };
});
```

```tsx [SolidJS · router.tsx]
import { Router } from "@solidjs/router";

import { routerFactory } from "_/router";
import { baseurl } from "~/config";
import app from "./App";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      return {
        router: <Router root={app} base={baseurl}>{routes}</Router>,
        app,
      };
    },
    async serverRouter(url) {
      return {
        router: <Router root={app} base={baseurl} url={url.pathname}>{routes}</Router>,
        app,
      };
    },
  }
});
```

```ts [Vue · router.ts]
import { createApp, createSSRApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";

import App from "./App.vue";

import { baseurl } from "~/config";
import { routerFactory } from "_/router";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      const app = createApp(App);
      const router = createRouter({
        history: createWebHistory(baseurl),
        routes,
        strict: true,
      });
      app.use(router);
      return { router, app };
    },
    async serverRouter(url) {
      const app = createSSRApp(App);
      const router = createRouter({
        history: createMemoryHistory(baseurl),
        routes,
        strict: true,
      });
      await router.push(url.pathname);
      await router.isReady();
      app.use(router);
      return { router, app };
    },
  };
});
```

:::

All use your source folder's `baseurl` config for correct path-based
routing. The generated `routes` are always wrapped inside your `App` component,
establishing the layout hierarchy.

React uses `createStaticHandler` and `createStaticRouter` for server rendering.
SolidJS simply passes the `url.pathname` prop to the shared `<Router>`.
Vue switches from `createWebHistory` to `createMemoryHistory` for SSR and
awaits `router.isReady()` before rendering.

## 🎯 Application Entry

The `entry/client.tsx` file is your application's DOM rendering entry point,
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

During SSR builds, the generator embeds a flag into the client bundle.
On page load, `renderFactory` reads this flag to select the
correct path: `serverRender()` for SSR hydration, `clientRender()` for a
fresh client-only mount.

::: code-group

```tsx [React · entry/client.tsx]
import { createRoot, hydrateRoot } from "react-dom/client";

import { createRoutes, renderFactory } from "_/entry/client";

import NotFound from "../components/404";
import routerFactory from "../router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes({ withPreload: true });
  const { clientRouter } = routerFactory(routes);
  renderFactory(() => {
    return {
      async clientRender() {
        const { router } = await clientRouter();
        createRoot(root).render(router);
      },
      async serverRender() {
        const { router } = await clientRouter();
        hydrateRoot(root, router);
      },
      async notFound() {
        createRoot(root).render(<NotFound />);
      },
    };
  });
} else {
  console.error("Root element not found!");
}
```

```tsx [SolidJS · entry/client.tsx]
import { hydrate, render } from "solid-js/web";

import { createRoutes, renderFactory } from "_/entry/client";

import routerFactory from "../router";
import NotFound from "../components/404";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes({ withPreload: true });
  const { clientRouter } = routerFactory(routes);
  renderFactory(() => {
    return {
      async clientRender() {
        const { router } = await clientRouter();
        render(() => router, root);
      },
      async serverRender() {
        const { router } = await clientRouter();
        hydrate(() => router, root)
      },
      async notFound() {
        render(NotFound, root);
      }
    }
  });
} else {
  console.error("❗Root element not found!");
}
```

```ts [Vue · entry/client.ts]
import { createApp } from "vue";

import { createRoutes, renderFactory } from "_/entry/client";

import NotFound from "../components/404.vue";
import routerFactory from "../router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes();
  const { clientRouter } = routerFactory(routes);
  renderFactory(() => {
    return {
      async clientRender() {
        const { app } = await clientRouter();
        app.mount(root);
      },
      async serverRender() {
        const { app } = await clientRouter();
        app.mount(root, true);
      },
      async notFound() {
        createApp(NotFound).mount(root);
      },
    };
  });
} else {
  console.error("Root element not found!");
}
```
:::

- React uses `createRoot`/`hydrateRoot` from `react-dom/client`.
- SolidJS uses `render`/`hydrate` from `solid-js/web`.
- Vue constructs separate app instances via `createApp` and `createSSRApp`, mounting with the hydration flag on the SSR path.
