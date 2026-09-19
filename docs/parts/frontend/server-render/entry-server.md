
<!-- #region react -->
```ts
// React: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```
<!-- #endregion react -->

<!-- #region solid -->
```ts
// Solid: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```
<!-- #endregion solid -->

<!-- #region vue -->
```ts
// Vue: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

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
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```
<!-- #endregion vue -->

<!-- #region svelte -->
```ts
// Svelte: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on Svelte folders
} from "_/entry/server";

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
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```
<!-- #endregion svelte -->

<!-- #region mdx -->
```ts
// MDX: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on MDX folders
} from "_/entry/server";

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
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```
<!-- #endregion mdx -->

