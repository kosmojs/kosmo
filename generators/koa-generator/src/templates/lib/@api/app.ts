import Router, { type RouterMiddleware } from "@koa/router";
import Koa from "koa";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

import type { DefaultContext, DefaultState } from "../api";

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

export function appFactory(
  routes: Array<Route<RouterMiddleware>>,
  options: AppOptions,
): App;

export function appFactory(
  routes: Array<Route<RouterMiddleware>>,
  fn: (a: { app: App; router: Router<never> }) => void,
): App;

export function appFactory(
  routes: Array<Route<RouterMiddleware>>,
  options: AppOptions,
  fn: (a: { app: App; router: Router<never> }) => void,
): App;

export function appFactory(
  routes: Array<Route<RouterMiddleware>>,
  ...rest: Array<unknown>
): App {
  const [options, fn] = typeof rest[0] === "function" ? [{}, rest[0]] : rest;

  const { debug = undefined, ...appOptions } = {
    ...(options ? { ...options } : {}),
  };

  const app = new Koa<DefaultContext, DefaultState>(appOptions);
  const router = new Router();

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

  if (typeof fn === "function") {
    fn({ app, router });
  }

  // NOTE: Routes should be added last, after any middleware
  app.use(router.routes());

  return app;
}
