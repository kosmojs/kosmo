import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on Svelte folders
} from "{{ createImport 'libEntry' 'server' }}";

import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
