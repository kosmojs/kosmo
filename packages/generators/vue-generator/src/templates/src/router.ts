import { createApp, createSSRApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";

import { baseurl } from "{{ createImport 'config' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App.vue";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      const app = createApp(App);
      const router = createRouter({
        history: createWebHistory(baseurl),
        routes,
        strict: true,
      });
      app.use(router);
      return { router, app };
    },
    async serverRouter(url) {
      const app = createSSRApp(App);
      const router = createRouter({
        history: createMemoryHistory(baseurl),
        routes,
        strict: true,
      });
      await router.push(url.pathname.replace(baseurl, ""));
      await router.isReady();
      app.use(router);
      return { router, app };
    },
  };
});
