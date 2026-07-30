---
title: Application Structure
description: Generator-produced foundation files for React, SolidJS, Vue, Svelte and MDX applications -
  root App component, router configuration, and client entry point with SSR hydration support.
head:
  - - meta
    - name: keywords
      content: react app foundation, solidjs app structure, vue app, svelte app, mdx app,
        suspense setup, router integration, createRoot, hydration, app entry point,
        vite entry, strictmode setup, solidjs router, vue router, react router.
---

Each framework generator produces a small set of foundation files that wire up
routing, navigation, and application bootstrap. The structure is consistent
across frameworks: a root App component, a router configuration, and a client
entry point.

## Root Application Component

The generator creates a minimal root component as your application shell.
Extend it with global layouts, error boundaries, authentication providers, or
other application-wide concerns.

::: code-group

```tsx [React]
// App.tsx
import { Outlet } from "react-router";

export default function App() {
  return <Outlet />;
}
```

```tsx [SolidJS]
// App.tsx
import type { ParentComponent } from "solid-js";

const App: ParentComponent = (props) => {
  return props.children;
};

export default App;
```

```vue [Vue]
// App.vue
<template>
  <RouterView />
</template>
```

```svelte [Svelte]
// App.svelte
<script lang="ts">
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
```

```mdx [MDX]
// App.mdx
{props.children}
```
:::

## Router Configuration

The `routerFactory` function in `router.ts` file connects your root App component
and generated routes to the framework's native router.
It accepts a callback receiving auto-generated route definitions from `KosmoJS`.

The callback must return two functions:

- `clientRouter()` - browser-based routing for client-side navigation
- `serverRouter(url)` - server-side routing for SSR, receiving the requested URL

::: code-group

```tsx [React]
import routerFactory, { createRouters } from "_/router";

import app from "./App";

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

import app from "./App";

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

import app from "./App.vue";

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

```svelte [Svelte]
import routerFactory, { createRouters } from "_/router";

import app from "./App.svelte";

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

import app from "./App.mdx";
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

The generated `routes` are always wrapped inside your `App` component,
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

If you need custom mounting (a different root resolution, an extra provider around the tree, your own hydration strategy),
ignore them and build the component yourself: the entry only needs to render the
router's component into `root`. Read the generated `_/entry/client` source to see
exactly what they do, then substitute your own.
