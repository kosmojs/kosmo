import { createRoot, hydrateRoot } from "react-dom/client";

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
        createRoot(root).render(router);
      },
      async hydrate() {
        const { router } = await clientRouter();
        hydrateRoot(root, router);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
