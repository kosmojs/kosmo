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
        page.mount(root);
      },
      async hydrate() {
        const page = await clientRouter();
        page.mount(root, true);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
