import type { JSX, ComponentType } from "react";

import {
  type RouteObject,
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import { base } from "{{ createImport 'libCore' }}";

export const createRouters = (
  routes: Array<RouteObject>,
  { app }: { app: ComponentType },
): {
  clientRouter: () => RouterFactoryReturn<Promise<JSX.Element>>;
  serverRouter: (url: URL) => RouterFactoryReturn<Promise<JSX.Element>>;
} => {
  const routeStack = [
    {
      path: "/",
      Component: app,
      children: routes,
    },
  ];

  const handler = createStaticHandler(routeStack, { basename: base });

  const clientRouter = async () => {
    const router = createBrowserRouter(routeStack, { basename: base });
    const component = <RouterProvider router={router} />;
    return { component };
  }

  const serverRouter = async (url: URL) => {

    const context = await handler.query(new Request(url.href));

    if (context instanceof Response) {
      // handled by SSR server
      throw context;
    }

    const router = createStaticRouter(routeStack, context);
    const component = <StaticRouterProvider router={router} context={context} />;

    return { component };
  }

  return { clientRouter, serverRouter }
}

export default createRouterFactory<RouteObject, Promise<JSX.Element>>();
