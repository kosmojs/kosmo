import { renderToString } from "vue/server-renderer";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'server' }}";
import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);
      const head = assets.map(({ tag }) => tag).join("\n");
      const html = await renderToString(page);
      return { head, html };
    },
  };
});
