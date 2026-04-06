import { renderToString, generateHydrationScript } from "solid-js/web";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'server' }}";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: false });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToString(url, { assets }) {
      const { router } = await serverRouter(url);
      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        hydrationScript,
      );
      const html = renderToString(() => router);
      return { head, html };
    },
  };
});
