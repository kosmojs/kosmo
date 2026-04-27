import { createApp, createSSRApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";

import { base } from "{{ createImport 'libCore' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App.vue";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      const app = createApp(App);
      const router = createRouter({
        history: createWebHistory(base),
        routes,
        strict: true,
      });
      app.use(router);
      return app;
    },
    async serverRouter(url) {
      const app = createSSRApp(App);
      const router = createRouter({
        history: createMemoryHistory(base),
        routes,
        strict: true,
      });
      await router.push(url.pathname.replace(base, ""));
      await router.isReady();
      app.use(router);
      return app;
    },
  };
});
