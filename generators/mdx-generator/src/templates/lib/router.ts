import type { ComponentType } from "preact";

import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import {
  createRouter,
  type RawRoute,
  type ResolvedRoute,
} from "{{ createImport 'lib' 'mdx' }}";

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
  clientRouter: () => RouterFactoryReturn<
    Promise<ResolvedRoute["component"]>,
    ResolvedRoute
  >;
  serverRouter: (
    url: URL,
  ) => RouterFactoryReturn<Promise<ResolvedRoute["component"]>, ResolvedRoute>;
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
  Promise<ResolvedRoute["component"]>,
  { client: ResolvedRoute; server: ResolvedRoute }
>();
