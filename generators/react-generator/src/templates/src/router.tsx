import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";

import { base } from "{{ createImport 'libCore' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App";

export default routerFactory((routes) => {
  const routeStack = [
    {
      path: "/",
      Component: App,
      children: routes,
    },
  ];

  const handler = createStaticHandler(routeStack, { basename: base });

  return {
    async clientRouter() {
      const router = createBrowserRouter(routeStack, { basename: base });
      return <RouterProvider router={router} />;
    },
    async serverRouter(url) {
      const context = await handler.query(new Request(url.href));

      if (context instanceof Response) {
        // handled by SSR server
        throw context;
      }

      const router = createStaticRouter(routeStack, context);

      return <StaticRouterProvider router={router} context={context} />;
    },
  };
});
