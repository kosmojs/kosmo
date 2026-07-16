import { createRouter } from "{{ createImport 'lib' 'mdx' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";

import App from "./App.mdx";
import { components } from "./components/mdx"

export default routerFactory((routes) => {
  const router = createRouter(routes, App, { components });
  return {
    async clientRouter() {
      return router.resolve();
    },
    async serverRouter(url) {
      return router.resolve(url);
    },
  };
});
