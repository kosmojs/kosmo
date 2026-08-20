import Router, { type RouterMiddleware } from "@koa/router";
import Koa from "koa";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

import type { DefaultContext, DefaultState } from "../api";

export type App = Koa<DefaultState, DefaultContext>;

export type AppOptions = ConstructorParameters<
  typeof Koa<DefaultState, DefaultContext>
>[0] & { router?: Router; debug?: RouteDebugOption };

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

  const {
    router = new Router(),
    debug = undefined,
    ...appOptions
  } = {
    ...(options ? { ...options } : {}),
  };

  for (const route of routes) {
    if (typeof debug === "function") {
      (debug as Function)(route.debug, route);
    } else if (debug) {
      console.log(route.debug[typeof debug === "string" ? debug : "full"]);
    }
    router.register(route.path, route.methods, route.middleware, route);
  }

  const app = new Koa(appOptions);

  if (typeof fn === "function") {
    fn({ app, router });
  }

  return app;
}
