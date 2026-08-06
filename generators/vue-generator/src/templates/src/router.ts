import routerFactory, { createRouters } from "{{ createImport 'lib' 'router' }}";
import { appProvider } from "{{ createImport 'lib' 'app' }}";

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
