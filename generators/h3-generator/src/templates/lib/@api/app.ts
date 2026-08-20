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
    for (const method of route.methods) {
      // last middleware is the handler
      const handler = route.middleware.at(-1);
      if (handler) {
        app.on(method, route.path, handler as never, {
          middleware: route.middleware.slice(0, -1),
        });
      }
    }
  }

  return app;
}
