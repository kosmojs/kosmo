import Router, { type RouterMiddleware } from "@koa/router";
import Koa from "koa";

import type { Route } from "@kosmojs/core/api";

import type { DefaultContext, DefaultState } from "../api";

export type App = Koa<DefaultState, DefaultContext>;

export type AppOptions = ConstructorParameters<
  typeof Koa<DefaultState, DefaultContext>
>[0] & { router?: Router };

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

  const { router = new Router(), ...appOptions } = {
    ...(options ? { ...options } : {}),
  };

  for (const { name, path, methods, middleware } of routes) {
    router.register(path, methods, middleware, { name });
  }

  const app = new Koa(appOptions);

  if (typeof fn === "function") {
    fn({ app, router });
  }

  return app;
}
