import { hydrate, render } from "solid-js/web";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'client' }}";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      async mount() {
        const page = await clientRouter();
        render(() => page, root);
      },
      async hydrate() {
        const page = await clientRouter();
        hydrate(() => page, root)
      },
    }
  });
} else {
  console.error("❌ Root element not found!");
}
