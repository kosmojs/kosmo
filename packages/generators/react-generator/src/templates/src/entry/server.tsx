import { renderToString } from "react-dom/server";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'server' }}";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: false });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const { router } = await serverRouter(url);
      const head = assets.map(({ tag }) => tag).join("\n");
      const html = renderToString(router);
      return { head, html };
    },
  };
});
