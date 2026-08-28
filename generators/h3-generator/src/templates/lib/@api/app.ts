import { H3, type Middleware } from "h3";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

export type App = H3;

export type AppOptions = ConstructorParameters<typeof H3>[0] & {
  debug?: RouteDebugOption;
};

export function appFactory(
  routes: Array<Route<Middleware>>,
  options: AppOptions,
): App;

export function appFactory(
  routes: Array<Route<Middleware>>,
  fn: (a: { app: App }) => void,
): App;

export function appFactory(
  routes: Array<Route<Middleware>>,
  options: AppOptions,
  fn: (a: { app: App }) => void,
): App;

export function appFactory(
  routes: Array<Route<Middleware>>,
  ...rest: Array<unknown>
): App {
  const [options, fn] = typeof rest[0] === "function" ? [{}, rest[0]] : rest;

  const { debug = undefined, ...appOptions } = {
    ...(options ? { ...options } : {}),
  };

  const app = new H3(appOptions);

  if (typeof fn === "function") {
    fn({ app });
  }

  for (const route of routes) {
    if (typeof debug === "function") {
      (debug as Function)(route.debug, route);
    } else if (debug) {
      console.log(route.debug[typeof debug === "string" ? debug : "full"]);
    }

    // last middleware is the handler
    const handler = route.middleware.at(-1);

    if (handler) {
      app.on(route.method, route.path, handler as never, {
        middleware: route.middleware.slice(0, -1),
      });
      if (
        route.method === "GET" &&
        !routes.some((e) => e.path === route.path && e.method === "HEAD")
      ) {
        /**
         * Register HEAD against the sibling GET handler,
         * matching the HEAD-via-GET dispatch hono and koa provide natively.
         * */
        app.on("HEAD", route.path, handler as never, {
          middleware: route.middleware.slice(0, -1),
        });
      }
    }
  }

  const routesByPath = routes.reduce<Record<string, Array<Route<Middleware>>>>(
    (map, route) => {
      if (!map[route.path]) {
        map[route.path] = [];
      }
      map[route.path].push(route);
      return map;
    },
    {},
  );

  for (const [path, routes] of Object.entries(routesByPath)) {
    const methods = routes.map((e) => e.method);

    app.all(path, (event) => {
      const allowedMethods = new Set([...methods, "OPTIONS"]);

      if (methods.includes("GET")) {
        allowedMethods.add("HEAD");
      }

      const status = event.req.method === "OPTIONS" ? 204 : 405;

      return new Response(undefined, {
        status,
        headers: { Allow: [...allowedMethods].join(", ") },
      });
    });
  }

  return app;
}
