import { renderToString } from "preact-render-to-string";

import renderFactory, { createRoutes } from "{{ createImport 'libEntry' 'server' }}";
import { renderHead } from "{{ createImport 'lib' 'mdx' }}"
import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);

      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        renderHead(page?.frontmatter)
      );

      const html = page ? renderToString(page.component) : "";

      return { html, head };
    },
  };
});
