<!-- #region react -->
```ts
// React: entry/client.ts
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
  console.error("Root element not found!");
}
```
<!-- #endregion react -->

<!-- #region solid -->
```ts
// Solid: entry/client.ts
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
  console.error("Root element not found!");
}
```
<!-- #endregion solid -->

<!-- #region vue -->
```ts
// Vue: entry/client.ts
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
  console.error("Root element not found!");
}
```
<!-- #endregion vue -->

<!-- #region svelte -->
```ts
// Svelte: entry/client.ts
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
  console.error("Root element not found!");
}
```
<!-- #endregion svelte -->

<!-- #region mdx -->
```ts
// MDX: entry/client.ts
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
  console.error("Root element not found!");
}
```
<!-- #endregion mdx -->
