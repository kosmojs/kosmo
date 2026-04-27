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
        const page = await clientRouter();
        createRoot(root).render(page);
      },
      async hydrate() {
        const page = await clientRouter();
        hydrateRoot(root, page);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
