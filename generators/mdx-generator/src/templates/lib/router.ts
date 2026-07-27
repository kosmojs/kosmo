import type { ComponentType } from "preact";

import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import {
  createRouter,
  type RawRoute,
  type Route,
  type RouteComponent,
} from "./mdx";

export const createRouters = (
  routes: Array<RawRoute>,
  {
    app,
    components,
  }: {
    app: ComponentType;
    components: Record<string, ComponentType<never>>;
  },
): {
  clientRouter: () => RouterFactoryReturn<Promise<RouteComponent>>;
  serverRouter: (
    url: URL,
  ) => RouterFactoryReturn<Promise<RouteComponent>, { route: Route }>;
} => {
  const router = createRouter(routes, app, { components });

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
