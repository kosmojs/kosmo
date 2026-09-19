<!-- #region react -->
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
<!-- #endregion react -->

<!-- #region solid -->
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
<!-- #endregion solid -->

<!-- #region vue -->
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
<!-- #endregion vue -->

<!-- #region svelte -->
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
<!-- #endregion svelte -->

<!-- #region mdx -->
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
<!-- #endregion mdx -->
