import { styleText } from "node:util";

import Router, { type RouterMiddleware } from "@koa/router";
import Koa from "koa";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

import type { DefaultContext, DefaultState } from "../api";

export type App = Koa<DefaultState, DefaultContext>;

export type AppOptions = ConstructorParameters<
  typeof Koa<DefaultState, DefaultContext>
>[0] & { debug?: RouteDebugOption };

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

  const app = new Koa(appOptions);
  const router = new Router();

  for (const route of routes) {
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

    if (
      methods.includes("GET") &&
      methods.indexOf("HEAD") > methods.indexOf("GET")
    ) {
      console.warn("----");
      console.warn(
        `${styleText("yellow", "WARN")}: HEAD handler for ${styleText("blue", routes[0].name)} route is unreachable - ${styleText("magenta", "define HEAD before GET")}`,
      );
      console.warn("----");
    }

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
