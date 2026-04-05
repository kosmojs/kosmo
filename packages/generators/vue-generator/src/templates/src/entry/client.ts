import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'client' }}";
import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      async mount() {
        const { app } = await clientRouter();
        app.mount(root);
      },
      async hydrate() {
        const { app } = await clientRouter();
        app.mount(root, true);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
