---
title: Application Structure
description: Generator-produced foundation files for React, SolidJS, Vue, Svelte
    and MDX applications - root app component, AppProvider seam, router configuration
    and client entry point with SSR hydration support.
head:
  - - meta
    - name: keywords
      content: react app foundation, solidjs app structure, vue app, svelte app, mdx app,
        AppProvider, appProvider, provider seam, router integration, createRoot,
        hydration, app entry point, vite entry, solidjs router, vue router, react router.
---

Each framework generator produces a small set of foundation files that wire up routing,
navigation, and application bootstrap.

The structure is consistent across frameworks:
a root app component, a router configuration, and a client entry point.

## Root Application Component

The generator creates a minimal root component as your application shell.
Extend it with global layouts, error boundaries, authentication providers,
or other application-wide concerns.

The shell composes `AppProvider`, imported from `_/app`, around the routed tree.
`_/app` is a generated seam: a wrapper the framework generator owns and can swap under the hood.

By default it is a pass-through (it renders its children unchanged),
so out of the box your app behaves exactly like a plain shell.

::: code-group

```tsx [React]
// app.tsx
import { Outlet } from "react-router";
import { AppProvider } from "_/app";

export default function App() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
```

```tsx [SolidJS]
// app.tsx
import type { ParentComponent } from "solid-js";
import { AppProvider } from "_/app";

const app: ParentComponent = (props) => {
  return <AppProvider>{props.children}</AppProvider>;
};

export default app;
```

```vue [Vue]
<!-- app.vue -->
<script setup lang="ts">
import { AppProvider } from "_/app";
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
```

```svelte [Svelte]
<!-- app.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { AppProvider } from "_/app";
  let { children }: { children: Snippet } = $props();
</script>

<AppProvider>
  {@render children()}
</AppProvider>
```

```mdx [MDX]
// app.mdx
import { AppProvider } from "_/app";

<AppProvider>{props.children}</AppProvider>
```
:::

### Why the AppProvider seam

Wrapping the shell in `AppProvider` costs nothing when it is a pass-through,
and it buys one thing: features that need to wrap the whole tree in a provider -
a query client, a theme, an auth context - can be enabled without you editing your code.

The framework generator swaps the pass-through `_/app` for one that installs the provider,
and the file that composes it is untouched because it already wires `AppProvider` unconditionally.

Toggling such a feature on or off never changes your code.
A plain shell would force you to add and remove the provider wiring by hand each time.

## Router Configuration

The `routerFactory` function in `router.ts` file connects your root app component
and generated routes to the framework's native router.
It accepts a callback receiving auto-generated route definitions from `KosmoJS`.

The callback must return two functions:

- `clientRouter()` - browser-based routing for client-side navigation
- `serverRouter(url)` - server-side routing for SSR, receiving the requested URL

::: code-group

```tsx [React]
import routerFactory, { createRouters } from "_/router";

import app from "./app";

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, { app });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```

```tsx [SolidJS]
import routerFactory, { createRouters } from "_/router";

import app from "./app";

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, { app });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```

```ts [Vue]
import routerFactory, { createRouters } from "_/router";
import { appProvider } from "_/app";

import app from "./app.vue";

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, {
    app,
    use: [[appProvider, undefined]],
  });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```

```svelte [Svelte]
import routerFactory, { createRouters } from "_/router";

import app from "./app.svelte";

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, { app });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```

```tsx [MDX]
import routerFactory, { createRouters } from "_/router";

import app from "./app.mdx";
import { components } from "./components/mdx"

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, { app, components });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```
:::

The generated `routes` are always wrapped inside your `app` component,
establishing the layout hierarchy.

## Application Entry

The `entry/client.ts` file is your application's DOM rendering entry point,
referenced from `index.html`:

```html
<script type="module" src="./entry/client.ts"></script>
```

Vite begins from this HTML file, follows the import to `entry/client`, and
constructs the complete application dependency graph from there.

The `renderFactory` function orchestrates two rendering modes via a callback
that must return:

- `mount()` - mounts the application fresh in the browser
- `hydrate()` - hydrates pre-rendered server HTML for interactivity

On page load, `renderFactory` reads `__KOSMO_HYDRATION_BOOL__` flag to select the
correct method: `hydrate()` for SSR hydration, `mount()` for a fresh client-only mount.

::: code-group

```tsx [React]
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```

```tsx [SolidJS]
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```

```ts [Vue]
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```

```svelte [Svelte]
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```

```tsx [MDX]
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```
:::

Under the hood:

- React uses `createRoot`/`hydrateRoot` from `react-dom/client`.
- SolidJS uses `render`/`hydrate` from `solid-js/web`.
- Vue constructs separate app instances via `createApp` and `createSSRApp`.
- Svelte uses `mount`/`hydrate` from `svelte`.
- MDX uses `render`/`hydrate` from `preact`.

The generated `hydrate` and `mount` are conveniences that wire the router to the
DOM the usual way - nothing more.

If you need custom mounting, ignore them and build the component yourself:
the entry only needs to render the router's component into `root`.

Read the generated `_/entry/client` source to see exactly what they do, then substitute your own.
