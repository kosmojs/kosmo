import routerFactory, { createRouters } from "{{ createImport 'lib' 'router' }}";

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
