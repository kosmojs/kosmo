<!-- #region react -->
```ts [router.ts]
// React: router.ts
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
<!-- #endregion react -->

<!-- #region solid -->
```ts [router.ts]
// Solid: router.ts
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
<!-- #endregion solid -->

<!-- #region vue -->
```ts [router.ts]
// Vue: router.ts
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
<!-- #endregion vue -->

<!-- #region svelte -->
```ts [router.ts]
// Svelte: router.ts
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
<!-- #endregion svelte -->

<!-- #region mdx -->
```ts [router.ts]
// MDX: router.ts
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
<!-- #endregion mdx -->
