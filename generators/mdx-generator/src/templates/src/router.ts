import routerFactory, { createRouters } from "{{ createImport 'lib' 'router' }}";

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
