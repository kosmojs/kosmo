---
title: Vue Generator - Application Structure
description: Core files generated for a Vue 3 application including App.vue structure,
    Vue Router configuration, and the client entry point used by Vite.
head:
  - - meta
    - name: keywords
      content: vue application structure, vue router, app.vue, entry point, client hydration, vite entry, kosmojs vue
---

To establish a reliable foundation for each source folder, the `Vue` generator
creates a small set of essential files automatically.

These files handle routing setup, typed navigation, and application bootstrap,
ensuring a consistent structure across all `KosmoJS`-powered `Vue` applications.

## 🎨 The App Component

The default generated minimal `App.vue` acts as the root component for the entire application:

```vue [App.vue]
<template>
  <RouterView />
</template>
```

This component forms your application shell. You can extend it with global
layouts, navigation, or shared providers as your project grows.

## 🛣️ Router Configuration

`router.ts` connects generated routes to Vue Router. It uses the configured
`baseurl` from the source folder's config to ensure correct path resolution.

```ts [router.ts]
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";

import { routerFactory } from "_/front/router";
import { baseurl } from "@/front/config";

export default routerFactory((app, routes) => {
  return {
    clientRouter() {
      const router = createRouter({
        history: createWebHistory(baseurl),
        routes,
        strict: true,
      });
      app.use(router);
      return router;
    },
    async serverRouter({ url }) {
      const router = createRouter({
        history: createMemoryHistory(baseurl),
        routes,
        strict: true,
      });
      await router.push(url.pathname);
      await router.isReady();
      app.use(router);
      return router;
    },
  };
});
```

The `routes` value above is generated code that reflects your directory-based
routing structure. We will explore that generated output in upcoming sections.

Every page is rendered within `App.vue` - a shell for all your pages/components.

## 🎯 Client Entry Point

`entry/client.ts` is the first script loaded by `index.html`.
It initializes the `Vue` application and attaches it to the DOM.

```ts [entry/client.ts]
import { createApp, createSSRApp } from "vue";

import { renderFactory, createRoutes } from "_/front/entry/client";
import App from "@/front/App.vue";
import createRouter from "@/front/router";

const root = document.getElementById("app");

if (root) {
  const routes = createRoutes();
  renderFactory(async () => {
    return {
      async clientRender() {
        const app = createApp(App);
        await createRouter(app, routes);
        app.mount(root);
      },
      async serverRender() {
        const app = createSSRApp(App);
        await createRouter(app, routes);
        app.mount(root, true);
      },
    }
  });
} else {
  console.error("Root element not found!");
}
```

`renderFactory` should return an object containing both `clientRender` and `serverRender` functions.

`serverRender` needed for hydration in SSR mode.

SSR builds inject an `ssrMode` flag into the generated client bundle.
This flag delivers precise runtime awareness - the client bundle explicitly understands its rendering environment.
On page load, `renderFactory` consults this flag to select the rendering approach:

- Flag value true (SSR-enabled bundle) - `serverRender()` activates for markup hydration
- Flag value false (client-only bundle) - `clientRender()` triggers a fresh mount

You supply both rendering functions; renderFactory picks the correct one according to the build flag.

Then `index.html` is importing `entry/client.ts` file:

```html
<script type="module" src="./entry/client.ts"></script>
```

This HTML document acts as Vite's entry point. From there, `Vite` builds your
application graph starting from the client script and router.

---

With these core files in place, each source folder becomes a fully structured
`Vue` application - ready for routing, layout, and data-loading capabilities
powered by `KosmoJS`.
