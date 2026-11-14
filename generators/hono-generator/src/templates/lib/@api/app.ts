import { Hono, type MiddlewareHandler } from "hono";
import type { Router } from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";

import type { Route, RouteDebugOption } from "@kosmojs/core/api";

import type { DefaultBindings, DefaultVariables } from "../api";
import { routes } from "./router";

export type AppEnv = {
  Variables: DefaultVariables;
  Bindings: DefaultBindings;
};

export type App = Hono<AppEnv>;

export type AppOptions = ConstructorParameters<typeof Hono<AppEnv>>[0] & {
  debug?: RouteDebugOption;
};

export type AppCallback = (a: { app: App; router: Router<never> }) => void;

/**
 * Builds the app with every route registered and none imported:
 * a route file is imported by the first request to that route.
 *
 * `fn` runs before the routes are registered.
 * Middleware and error handlers set there wrap every route,
 * and a route registered there takes the place of the route file with the same method and path.
 * */
export function appFactory(fn?: AppCallback, options?: AppOptions): App {
  const router = new SmartRouter({
    routers: [new RegExpRouter(), new TrieRouter()],
  }) as Router<never>;

  const { debug = undefined, ...appOptions } = {
    ...(options ? { ...options } : {}),
  };

  const app = new Hono({
    strict: false,
    router,
    ...appOptions,
  });

  if (typeof fn === "function") {
    fn({ app, router });
  }

  for (const route of routes) {
    if (typeof debug === "function") {
      (debug as Function)(route.debug, route);
    } else if (debug) {
      console.log(route.debug[typeof debug === "string" ? debug : "full"]);
    }

    app.on(route.method, [route.path], ...route.middleware);
  }

  const routesByPath = routes.reduce<
    Record<string, Array<Route<MiddlewareHandler>>>
  >((map, route) => {
    if (!map[route.path]) {
      map[route.path] = [];
    }
    map[route.path].push(route);
    return map;
  }, {});

  for (const [path, routes] of Object.entries(routesByPath)) {
    const methods = routes.map((e) => e.method);

    app.all(path, (ctx) => {
      const allowedMethods = new Set([...methods, "OPTIONS"]);

      if (methods.includes("GET")) {
        allowedMethods.add("HEAD");
      }

      const status = ctx.req.method === "OPTIONS" ? 204 : 405;

      return new Response(undefined, {
        status,
        headers: { Allow: [...allowedMethods].join(", ") },
      });
    });
  }

  return app as never;
}
