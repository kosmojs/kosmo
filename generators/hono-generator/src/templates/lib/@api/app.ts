import { Hono, type MiddlewareHandler } from "hono";
import type { Router } from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";

import type { Route } from "@kosmojs/core/api";

import type { DefaultBindings, DefaultVariables } from "../api";

export type AppEnv = {
  Variables: DefaultVariables;
  Bindings: DefaultBindings;
};

export type App = Hono<AppEnv>;

export type AppOptions = ConstructorParameters<typeof Hono<AppEnv>>[0];

export function appFactory(
  routes: Array<Route<MiddlewareHandler>>,
  options: AppOptions,
): App;

export function appFactory(
  routes: Array<Route<MiddlewareHandler>>,
  fn: (a: { app: App; router: Router<never> }) => void,
): App;

export function appFactory(
  routes: Array<Route<MiddlewareHandler>>,
  options: AppOptions,
  fn: (a: { app: App; router: Router<never> }) => void,
): App;

export function appFactory(
  routes: Array<Route<MiddlewareHandler>>,
  ...rest: Array<unknown>
): App {
  const [options, fn] = typeof rest[0] === "function" ? [{}, rest[0]] : rest;

  const router = new SmartRouter({
    routers: [new RegExpRouter(), new TrieRouter()],
  }) as Router<never>;

  const app = new Hono({
    strict: false,
    router,
    ...(options ? { ...options } : {}),
  });

  if (typeof fn === "function") {
    fn({ app, router });
  }

  for (const { path, methods, middleware } of routes) {
    app.on(methods, [path], ...middleware);
  }

  return app as never;
}
