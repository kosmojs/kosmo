import { generateHydrationScript, renderToStringAsync } from "solid-js/web";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'server' }}";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToString(url, { assets }) {
      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        hydrationScript,
      );
      const html = await renderToStringAsync(() => serverRouter(url));
      return { head, html };
    },
  };
});
