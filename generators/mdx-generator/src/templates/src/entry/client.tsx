import { hydrate } from "preact";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'client' }}";
import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      async mount() {
        const page = await clientRouter();
        hydrate(page.component, root);
      },
      async hydrate() {
        const page = await clientRouter();
        hydrate(page.component, root);
      }
    };
  });
} else {
  console.error("❌ Root element not found!");
}
