import Router, { type RouterMiddleware } from "@koa/router";
import Koa from "koa";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

import type { DefaultContext, DefaultState } from "../api";
import { routes } from "./router";

export type App = Koa<DefaultState, DefaultContext>;

export type AppOptions = ConstructorParameters<
  typeof Koa<DefaultState, DefaultContext>
>[0] & { debug?: RouteDebugOption };

/**
 * @koa/router registers every GET for HEAD as well,
 * and runs all layers matching a request in the order they were registered.
 * A HEAD handler registered after the GET of its path would therefore never run:
 * the GET layer answers first and does not call next.
 *
 * Each HEAD route is moved just ahead of the GET of its own path.
 * Nothing else changes position, and HEAD routes never move past other paths,
 * so routes still match in the order given - e.g. a static path ahead of a dynamic one
 * that also matches it.
 * */
const registrationOrder = (routes: Array<Route<RouterMiddleware>>) => {
  const headRoutes = new Map<string, Array<Route<RouterMiddleware>>>();

  for (const route of routes) {
    if (route.method === "HEAD") {
      headRoutes.set(route.path, [
        ...(headRoutes.get(route.path) ?? []),
        route,
      ]);
    }
  }

  const ordered: Array<Route<RouterMiddleware>> = [];
  const placed = new Set<Route<RouterMiddleware>>();

  const place = (route: Route<RouterMiddleware>) => {
    if (!placed.has(route)) {
      placed.add(route);
      ordered.push(route);
    }
  };

  for (const route of routes) {
    if (route.method === "GET") {
      for (const headRoute of headRoutes.get(route.path) ?? []) {
        place(headRoute);
      }
    }
    place(route);
  }

  return ordered;
};

export type AppCallback = (a: {
  app: App;
  router: Router<DefaultState, DefaultContext>;
}) => void;

/**
 * Builds the app with every route registered and none imported:
 * a route file is imported by the first request to that route.
 *
 * `fn` runs before the routes are registered.
 * Middleware and error handlers set there wrap every route,
 * and a route registered there takes the place of the route file with the same method and path.
 * */
export function appFactory(fn?: AppCallback, options?: AppOptions): App {
  const { debug = undefined, ...appOptions } = {
    ...(options ? { ...options } : {}),
  };

  const app = new Koa<DefaultState, DefaultContext>(appOptions);
  const router = new Router();

  if (typeof fn === "function") {
    fn({ app, router });
  }

  for (const route of registrationOrder(routes)) {
    if (typeof debug === "function") {
      (debug as Function)(route.debug, route);
    } else if (debug) {
      console.log(route.debug[typeof debug === "string" ? debug : "full"]);
    }
    router.register(route.path, [route.method], route.middleware, route);
  }

  const routesByPath = routes.reduce<
    Record<string, Array<Route<RouterMiddleware>>>
  >((map, route) => {
    if (!map[route.path]) {
      map[route.path] = [];
    }
    map[route.path].push(route);
    return map;
  }, {});

  for (const [path, routes] of Object.entries(routesByPath)) {
    const methods = routes.map((e) => e.method);

    router.all(path, (ctx) => {
      const allowedMethods = new Set([...methods, "OPTIONS"]);

      if (methods.includes("GET")) {
        allowedMethods.add("HEAD");
      }

      ctx.status = ctx.method === "OPTIONS" ? 204 : 405;

      ctx.set("Allow", [...allowedMethods].join(", "));
    });
  }

  // NOTE: Routes should be added last, after any middleware
  app.use(router.routes());

  return app;
}
