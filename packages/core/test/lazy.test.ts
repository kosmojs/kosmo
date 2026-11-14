import { afterEach, describe, expect, test, vi } from "vitest";

import { createRoutes } from "#/api/routes";
import type {
  HandlerDefinition,
  HTTPMethod,
  RouteModules,
  RouteSource,
} from "#/api/types";
import { use } from "#/api/use";

type Ctx = { log: Array<string> };
type Middleware = (ctx: Ctx, next: () => Promise<unknown>) => unknown;

// a middleware that records its name when it runs
const middleware = (name: string, { last = false } = {}): Middleware => {
  return (ctx, next) => {
    ctx.log.push(name);
    return last ? name : next();
  };
};

const handler = (method: HTTPMethod): HandlerDefinition<Middleware> => {
  return {
    kind: "handler",
    method,
    middleware: [middleware(`${method} handler`, { last: true })],
  };
};

// runs a chain the way a framework would, as koa-compose does
const compose = (chain: Array<Middleware>): Middleware => {
  return (ctx, next) => {
    const dispatch = async (i: number): Promise<unknown> => {
      return i === chain.length ? next() : chain[i](ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
};

/**
 * A source over the given modules, counting how many times it was loaded.
 * `modules` may also be a function, to fail a load or change what the next one returns.
 * */
const routeSource = (
  methods: Array<HTTPMethod>,
  modules:
    | Partial<RouteModules<Middleware>>
    | (() => Partial<RouteModules<Middleware>>),
) => {
  const loads = { count: 0 };

  const source: RouteSource<Middleware> = {
    name: "demo",
    path: "/api//demo/",
    pathPattern: "/api/demo",
    file: "demo/index.ts",
    params: [],
    numericProperties: { params: [], query: {} },
    booleanProperties: { query: {} },
    methods,
    async load() {
      loads.count += 1;
      return {
        cascadingMiddleware: [],
        definitionItems: [],
        ...(typeof modules === "function" ? modules() : modules),
      };
    },
  };

  return { source, loads };
};

// counts how many times a chain was composed
const composed = { count: 0 };

const routesOf = (source: RouteSource<Middleware>) => {
  return createRoutes<Middleware, Middleware>([source], {
    productionBuild: false,
    createMetaparsers: () => ({}) as never,
    createBodyparsers: () => ({}) as never,
    responseResolver: () => ({}) as never,
    globalMiddleware: [],
    composeMiddleware(chain) {
      composed.count += 1;
      return compose(chain);
    },
  });
};

// send a request through the single middleware a route is registered with
const request = async (route: ReturnType<typeof routesOf>[number]) => {
  const ctx: Ctx = { log: [] };
  const result = await route.middleware[0](ctx, async () => "next");
  return { result, log: ctx.log };
};

afterEach(() => {
  composed.count = 0;
  vi.restoreAllMocks();
});

describe("createRoutes", () => {
  test("registers a route per method, without loading anything", () => {
    const { source, loads } = routeSource(["GET", "POST"], {});

    const routes = routesOf(source);

    expect(
      routes.map(({ name, path, file, method, middleware }) => {
        return [name, path, file, method, middleware.length];
      }),
    ).toEqual([
      ["demo", "/api/demo", "demo/index.ts", "GET", 1],
      ["demo", "/api/demo", "demo/index.ts", "POST", 1],
    ]);

    expect(loads.count).toEqual(0);
  });

  test("the first request loads the route and runs its full chain", async () => {
    const { source, loads } = routeSource(["GET"], {
      cascadingMiddleware: [use(middleware("cascading"))],
      definitionItems: [use(middleware("inline")), handler("GET")],
    });

    const [route] = routesOf(source);

    expect(await request(route)).toEqual({
      result: "GET handler",
      // the built-in edge middleware is anonymous
      log: ["cascading", "inline", "GET handler"],
    });
    expect(loads.count).toEqual(1);
  });

  test("loads once and composes once per method, however many requests", async () => {
    const { source, loads } = routeSource(["GET", "POST"], {
      definitionItems: [handler("GET"), handler("POST")],
    });

    const [get, post] = routesOf(source);

    // two requests in flight before the load settles
    const results = await Promise.all([request(post), request(get)]);
    results.push(await request(get));
    results.push(await request(post));

    expect(results.map((e) => e.result)).toEqual([
      "POST handler",
      "GET handler",
      "GET handler",
      "POST handler",
    ]);
    expect(loads.count).toEqual(1);
    expect(composed.count).toEqual(2);
  });

  test("a middleware limited to a method stays off the others", async () => {
    const { source } = routeSource(["GET", "POST"], {
      definitionItems: [
        use(middleware("post only"), { on: ["POST"] }),
        handler("GET"),
        handler("POST"),
      ],
    });

    const [get, post] = routesOf(source);

    expect((await request(get)).log).toEqual(["GET handler"]);
    expect((await request(post)).log).toEqual(["post only", "POST handler"]);
  });

  test("a failed load is not kept: the next request loads again", async () => {
    let broken = true;

    const { source, loads } = routeSource(["GET"], () => {
      if (broken) {
        throw new Error("does not compile");
      }
      return { definitionItems: [handler("GET")] };
    });

    const [route] = routesOf(source);

    await expect(request(route)).rejects.toThrow("does not compile");

    broken = false;

    expect((await request(route)).result).toEqual("GET handler");
    expect(loads.count).toEqual(2);
  });

  test("a method the file does not handle fails its request", async () => {
    const { source } = routeSource(["GET", "POST"], {
      definitionItems: [handler("GET")],
    });

    const [, post] = routesOf(source);

    await expect(request(post)).rejects.toThrow(
      "demo/index.ts: no POST handler found once loaded",
    );
  });

  test("warns about a handled method that is not registered", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { source } = routeSource(["GET"], {
      definitionItems: [handler("GET"), handler("DELETE")],
    });

    const [route] = routesOf(source);
    await request(route);
    await request(route);

    // once per load, not per request
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(
      /^demo\/index\.ts: DELETE not registered/,
    );
  });

  test("a route with no methods is not registered, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { source, loads } = routeSource([], {});

    expect(routesOf(source)).toEqual([]);
    expect(loads.count).toEqual(0);
    expect(String(warn.mock.calls[0][0])).toMatch(
      /^demo\/index\.ts: not registered/,
    );
  });

  test("debug says the chain is not known yet", () => {
    const { source } = routeSource(["GET"], {});

    const [route] = routesOf(source);

    expect(route.debug.headline).toContain("/api/demo");
    expect(route.debug.methods).toContain("GET");
    expect(route.debug.middleware).toContain("loaded on first request");
    expect(route.debug.handler).toContain("loaded on first request");
  });
});
