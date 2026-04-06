import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import { baseurl } from "{{ createImport 'config' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import app from "./App";

export default routerFactory((routes) => {
  const routeStack = [
    {
      path: "/",
      Component: app,
      children: routes,
    },
  ];

  const handler = createStaticHandler(routeStack, { basename: baseurl });

  return {
    async clientRouter() {
      const router = createBrowserRouter(routeStack, { basename: baseurl });
      return {
        router: <RouterProvider router={router} />,
        app,
      };
    },
    async serverRouter(url) {
      const context = await handler.query(new Request(url.href));

      if (context instanceof Response) {
        // handled by SSR server
        throw context;
      }

      const router = createStaticRouter(routeStack, context);

      return {
        router: <StaticRouterProvider router={router} context={context} />,
        app,
      };
    },
  };
});
