import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import Layouts from "./Layouts.svelte";
import {
  type AnyComponent,
  createRouter,
  type RawRoute,
  type Route,
  type RouteComponent,
} from "./svelte";

export const createRouters = (
  routes: Array<RawRoute>,
  { app }: { app: AnyComponent },
): {
  clientRouter: () => RouterFactoryReturn<Promise<RouteComponent>>;
  serverRouter: (
    url: URL,
  ) => RouterFactoryReturn<Promise<RouteComponent>, { route: Route }>;
} => {
  // <Layouts> is injected here rather than imported by ./svelte, so the core
  // router stays a plain module and there is no .ts <-> .svelte import cycle.
  const router = createRouter(routes, app, Layouts);

  return {
    clientRouter() {
      return router.resolve();
    },
    serverRouter(url) {
      return router.resolve(url);
    },
  };
};

export default createRouterFactory<
  RawRoute,
  Promise<RouteComponent>,
  { server: { route: Route } }
>();
