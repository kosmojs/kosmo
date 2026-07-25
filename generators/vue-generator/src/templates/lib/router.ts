import { type App, type Component, createApp, createSSRApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
} from "vue-router";

import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import { base } from "{{ createImport 'libCore' }}";

export type RouterWithLoaderData = Router & {
  __loaderData: Record<string, unknown>;
};

const runLoader = async (
  key: string,
  route: unknown,
  fetcher: (r: never) => Promise<unknown>,
) => {
  if (typeof window === "undefined" || !window.__KOSMO_HYDRATION_DATA__) {
    return fetcher(route as never);
  }
  return key in window.__KOSMO_HYDRATION_DATA__
    ? window.__KOSMO_HYDRATION_DATA__[key]
    : fetcher(route as never);
};

/**
 * Installs a beforeResolve guard that runs the matched chain's loaders
 * (layouts + leaf) before navigation commits, so components read data
 * synchronously at render time - no onServerPrefetch, no Suspense.
 * */
const installLoaderGuard = (router: RouterWithLoaderData) => {
  router.__loaderData = {};

  router.beforeResolve(async (to) => {
    const data: RouterWithLoaderData["__loaderData"] = {};

    for (const { name, meta } of to.matched) {
      if (!name || typeof name !== "string" || !meta.module) {
        continue;
      }

      const { loader } =
        typeof meta.module === "function" //
          ? await meta.module()
          : {};

      if (loader) {
        await runLoader(name, to, loader as never).then((v) => {
          // undefined does not survive JSON.stringify, thus null
          data[name] = v ?? null;
        });
      }
    }

    router.__loaderData = data;

    // consumed: clear so client navigations refetch, and click-handlers don't reuse
    if (typeof window !== "undefined") {
      window.__KOSMO_HYDRATION_DATA__ = undefined;
    }
  });
};

export const createRouters = (
  routes: Array<RouteRecordRaw>,
  { app }: { app: Component },
): {
  clientRouter: () => RouterFactoryReturn<Promise<App>>;
  serverRouter: (
    url: URL,
  ) => RouterFactoryReturn<
    Promise<App>,
    { loaderData: Record<string, unknown> }
  >;
} => {
  return {
    async clientRouter() {
      const component = createApp(app);

      const router = createRouter({
        history: createWebHistory(base),
        routes,
        strict: true,
      });

      installLoaderGuard(router as never);

      component.use(router);

      return { component };
    },

    async serverRouter(url) {
      const component = createSSRApp(app);

      const router = createRouter({
        history: createMemoryHistory(base),
        routes,
        strict: true,
      }) as RouterWithLoaderData;

      // must be installed before push - the initial navigation
      // would otherwise skip the guard
      installLoaderGuard(router);

      await router.push(url.pathname.replace(base, ""));

      await router.isReady();

      component.use(router);

      return { component, loaderData: router.__loaderData };
    },
  };
};

export default createRouterFactory<
  RouteRecordRaw,
  Promise<App>,
  { server: { loaderData: Record<string, unknown> } }
>();
