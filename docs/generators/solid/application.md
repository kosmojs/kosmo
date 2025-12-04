---
title: SolidJS - Application Structure
description: Generated SolidJS application files including App.tsx with Suspense boundaries,
    router.tsx with route configuration, and entry/client.tsx entry point for rendering to the DOM.
head:
  - - meta
    - name: keywords
      content: solidjs app structure, suspense boundary, solidjs router, app component, entry point, solidjs render, vite entry
---

To establish a robust foundation, `Solid` generator produces a suite of core files.

This infrastructure handles critical tasks like mapping your file structure to application routes,
enabling type-safe navigation, and ensuring efficient code-splitting through lazy loading.

## 🎨 The App Component

The generator creates a minimal `App.tsx` as your root application component.

```tsx [App.tsx]
import type { ParentComponent } from "solid-js";

const App: ParentComponent = (props) => {
  return props.children;
};

export default App;
```

This simple component serves as your application shell.

You can customize this component to add global layouts, error boundaries,
or other application-wide concerns.

## 🛣️ Router Configuration

The `router.tsx` file connects `KosmoJS`'s generated routes to SolidJS Router:

```tsx [router.tsx]
import type { ParentComponent } from "solid-js";
import { type RouteDefinition, Router } from "@solidjs/router";

import { baseurl } from "./config";

export default (
  App: ParentComponent,
  routes: Array<RouteDefinition>,
  ssrProps?: { url?: URL },
) => {
  if (ssrProps?.url) {
    return (
      <Router root={App} base={baseurl} url={ssrProps.url.pathname}>
        {routes}
      </Router>
    );
  }

  return (
    <Router root={App} base={baseurl}>
      {routes}
    </Router>
  );
};
```

This configuration uses your source folder's `baseurl` from the config file,
ensuring that routes are served from the correct path.

The `routes` import comes from generated code in your `lib` directory,
which we'll explore next.

The Router uses your App component as the root,
meaning every route renders within the App's component.

## 🎯 The Entry Point

The `entry/client.tsx` file serves as your application's entry point,
rendering your router into the DOM:

```tsx [entry/client.tsx]
import { hydrate, render } from "solid-js/web";

import { routeStackBuilder, shouldHydrate } from "@src/{solid}/client";
import App from "../App";
import createRouter from "../router";

const root = document.getElementById("app");

if (root) {
  const routes = routeStackBuilder({ withPreload: true });
  const router = createRouter(App, routes);
  if (shouldHydrate()) {
    hydrate(() => router, root)
  } else {
    render(() => router, root);
  }
} else {
  console.error("Root element not found!");
}
```

This file is referenced from your `index.html` file,
which `KosmoJS` creates when you initialize a source folder:

```html
<script type="module" src="./entry/client.tsx"></script>
```

The `index.html` file serves as entry point.
When `Vite` processes your application, it starts from this HTML file,
follows the script import to `entry/client.tsx`,
and builds your entire application graph from there.

