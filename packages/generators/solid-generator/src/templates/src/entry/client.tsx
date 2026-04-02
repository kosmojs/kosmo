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
        const { router } = await clientRouter();
        render(() => router, root);
      },
      async hydrate() {
        const { router } = await clientRouter();
        hydrate(() => router, root)
      },
    }
  });
} else {
  console.error("❌ Root element not found!");
}
