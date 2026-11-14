import { normalizePath } from "../generic";
import {
  type RequestBodyTarget,
  type RequestMetadataParser,
  RequestValidationTargets,
} from "../types";
import { debugRouteEntry } from "./debug";
import type {
  HandlerDefinition,
  LoadedRouteSource,
  MiddlewareDefinition,
  ResponseResolver,
  Route,
  RouteSource,
} from "./types";
import { use } from "./use";
import { createValidationMiddleware, StateKey } from "./validation";

type ResolveRoutesOptions<MiddlewareT> = {
  productionBuild: boolean;
  createMetaparsers: (
    r: LoadedRouteSource<MiddlewareT>,
    // biome-ignore lint: any
    ctx: any,
  ) => Record<RequestMetadataParser, () => unknown>;
  createBodyparsers: (
    r: LoadedRouteSource<MiddlewareT>,
    // biome-ignore lint: any
    ctx: any,
  ) => Record<
    RequestBodyTarget,
    // biome-ignore lint: any
    (opt?: any) => Promise<unknown>
  >;
  responseResolver: ResponseResolver;
  // Global middleware applied to every route (e.g., logging)
  globalMiddleware: Array<MiddlewareDefinition<MiddlewareT>>;
};

/**
 * Registers every route for the methods the generator read from its file,
 * with a single middleware standing in for its chain.
 *
 * Nothing is imported here: the first request to a route imports its file,
 * the use.ts files above it and its validation schemas,
 * then builds its chain once and runs it, as every request after it does.
 * So creating the routes takes the same time however many there are.
 * */
export const createRoutes = <MiddlewareT, MiddlewareR>(
  routeSources: Array<RouteSource<MiddlewareT>>,
  {
    composeMiddleware,
    ...options
  }: ResolveRoutesOptions<MiddlewareT> & {
    // runs a route's chain as one middleware, the way the framework runs a chain
    composeMiddleware: (chain: Array<MiddlewareR>) => MiddlewareR;
  },
): Array<Route<MiddlewareR>> => {
  return routeSources.flatMap(({ load, methods, ...routeMeta }) => {
    const { name, file } = routeMeta;
    const path = normalizePath(routeMeta.path);

    if (!methods.length) {
      console.warn(
        `${file}: not registered, no methods found in the array defineRoute returns`,
      );
    }

    // one load for all methods; a load that fails is not kept, the next request tries again
    let loading: Promise<Array<Route<MiddlewareR>>> | undefined;

    const loadRoutes = () => {
      loading ??= load()
        .then((modules) => {
          const routes = resolveRoutes<MiddlewareT, MiddlewareR>(
            [{ ...routeMeta, ...modules }],
            options,
          );
          const unregistered = routes
            .map((e) => e.method)
            .filter((e) => !methods.includes(e));
          if (unregistered.length) {
            console.warn(
              `${file}: ${unregistered.join(", ")} not registered - ` +
                "only handlers listed directly in the array defineRoute returns are",
            );
          }
          return routes;
        })
        .catch((error) => {
          loading = undefined;
          throw error;
        });
      return loading;
    };

    return methods.map((method) => {
      let composing: Promise<MiddlewareR> | undefined;

      const chain = () => {
        composing ??= loadRoutes()
          .then((routes) => {
            const route = routes.find((e) => e.method === method);
            if (!route) {
              throw new Error(
                `${file}: no ${method} handler found once loaded`,
              );
            }
            return composeMiddleware(route.middleware);
          })
          .catch((error) => {
            composing = undefined;
            throw error;
          });
        return composing;
      };

      // takes whatever the framework passes a middleware, and hands it to the chain
      const middleware = async (...args: Array<unknown>) => {
        const run = (await chain()) as (...a: Array<unknown>) => unknown;
        return run(...args);
      };

      return {
        name,
        path,
        file,
        method,
        middleware: [middleware as MiddlewareR],
        debug: debugRouteEntry({ name, path, file, method }),
      };
    });
  });
};

/**
 * Builds the chain of every method of routes already imported: one route per handler.
 * */
export const resolveRoutes = <MiddlewareT, MiddlewareR>(
  routeSources: Array<LoadedRouteSource<MiddlewareT>>,
  {
    productionBuild,
    createMetaparsers,
    createBodyparsers,
    responseResolver,
    globalMiddleware,
  }: ResolveRoutesOptions<MiddlewareT>,
): Array<Route<MiddlewareR>> => {
  // NOTE:: prioritized middleware must run in this exact order!
  const prioritizedSlots = [
    "edge",
    /^edge:.+/,
    "validate:params",
    "validate:query",
    "validate:headers",
    "validate:cookies",
    "validate:json",
    "validate:form",
    "validate:raw",
    "validate:response",
  ];

  /**
   * Whether a slot name is one this list already positions.
   *
   * NOTE: a plain `includes` cannot answer this - the list mixes literal names with patterns,
   * and `edge:auth` is a member by virtue of matching `/^edge:.+/`, not by being in the array.
   * */
  const isPrioritizedSlot = (slot: string): boolean => {
    return prioritizedSlots.some((entry) => {
      return typeof entry === "string" ? entry === slot : entry.test(slot);
    });
  };

  const stack: Array<Route<MiddlewareR>> = [];

  // Iterate over each route definition
  for (const routeSource of routeSources) {
    const { name, file } = routeSource;

    const edgeMiddleware = [
      use(
        /**
         * Extends context with:
         *
         * - `ctx.metaparser[target]()` - lazy, cached meta parsers.
         *   Each parser runs at most once per request;
         *   subsequent calls return the cached result.
         *
         * - `ctx.bodyparser[target](opts?)` - lazy, cached body parsers.
         *   Each parser runs at most once per request;
         *   subsequent calls return the cached result.
         *   This allows both user middleware/handlers and validators
         *   to call the same parser without re-consuming the request stream.
         *
         * - `ctx.validated` - getter that returns all validated data collected so far
         *   (params, query, headers, cookies, json etc.) as a plain object.
         *
         * Cache is stored on `ctx[StateKey]` (a Symbol-keyed Map) to keep it
         * hidden from public API surface and serialization.
         * */
        function useExtendContext(
          ctx: Record<string | symbol, Map<string, unknown>>,
          next: Function,
        ) {
          if (!ctx[StateKey]) {
            const [metaparsers, bodyparsers] = [
              createMetaparsers(routeSource, ctx),
              createBodyparsers(routeSource, ctx),
            ];

            // initialize per-request cache
            ctx[StateKey] = new Map();

            Object.defineProperty(ctx, "metaparser", {
              value: Object.fromEntries(
                Object.entries(metaparsers).map(([target, parser]) => {
                  return [
                    target,
                    () => {
                      if (!ctx[StateKey].has(target)) {
                        ctx[StateKey].set(target, parser());
                      }
                      return ctx[StateKey].get(target);
                    },
                  ];
                }),
              ),
              enumerable: true,
            });

            Object.defineProperty(ctx, "bodyparser", {
              value: Object.fromEntries(
                Object.entries(bodyparsers).map(([target, parser]) => {
                  return [
                    target,
                    async (opt?: unknown) => {
                      if (!ctx[StateKey].has(target)) {
                        ctx[StateKey].set(target, await parser(opt));
                      }
                      return ctx[StateKey].get(target);
                    },
                  ];
                }),
              ),
              enumerable: true,
            });

            Object.defineProperty(ctx, "validated", {
              value: Object.keys(RequestValidationTargets).reduce(
                (map, target) => {
                  return Object.defineProperty(map, target, {
                    get() {
                      return ctx[StateKey].get(`validated:${target}`);
                    },
                    enumerable: true,
                  });
                },
                {},
              ),
              enumerable: true,
            });
          }

          return next();
        },
        { slot: "edge" },
      ),
    ];

    const path = normalizePath(routeSource.path);

    // Include both middleware and HTTP method handlers
    const definitionItems = [
      ...routeSource.cascadingMiddleware,
      ...routeSource.definitionItems,
    ].flat();

    const routeMiddleware = definitionItems.filter(
      (e) => e.kind === "middleware",
    );

    /**
     * Every user-authored declaration of a slot, outermost first:
     * `api/use.ts`, then the cascading `use.ts` files, then the route itself.
     * */
    const slotDeclarations: Array<MiddlewareDefinition<MiddlewareT>> = [
      ...globalMiddleware,
      ...routeMiddleware,
    ];

    // built-in middleware, the fallback owner of the slots it ships with
    const builtinMiddleware: Array<MiddlewareDefinition<MiddlewareT>> = [
      ...edgeMiddleware,
      ...createValidationMiddleware(routeSource, {
        productionBuild,
        responseResolver,
      }),
    ];

    /**
     * The middleware that owns a slot.
     *
     * A slot is a named position with exactly one occupant: the innermost declaration wins,
     * so a route's `use` replaces a cascading `use.ts` entry,
     * which in turn replaces the global one - and any of them replaces the built-in.
     * Position is decided separately, by the outermost declaration,
     * so an override substitutes an implementation without moving the slot.
     * */
    const resolveSlot = (
      slot: string,
    ): MiddlewareDefinition<MiddlewareT> | undefined => {
      return (
        slotDeclarations.findLast((e) => e.options?.slot === slot) ||
        builtinMiddleware.find((e) => e.options?.slot === slot)
      );
    };

    const routeStack: Array<
      MiddlewareDefinition<MiddlewareT> | HandlerDefinition<MiddlewareT>
    > = [
      ...prioritizedSlots.flatMap((slot) => {
        if (typeof slot === "string") {
          const middleware = resolveSlot(slot);
          return middleware //
            ? [middleware]
            : [];
        }

        /**
         * A pattern entry (`edge:*`) is a family of slots, not a single position:
         * each distinct name in it gets its own place in the chain,
         * in the order the names were first declared,
         * so `edge:ratelimit` and `edge:auth` both run at the edge
         * and either can be overridden on its own.
         * */
        const slotNames: Array<string> = [];

        for (const { options } of slotDeclarations) {
          const name = options?.slot;
          if (name && slot.test(name) && !slotNames.includes(name)) {
            slotNames.push(name);
          }
        }

        return slotNames.flatMap((name) => {
          const middleware = resolveSlot(name);
          return middleware //
            ? [middleware]
            : [];
        });
      }),

      ...globalMiddleware.flatMap((entry) => {
        if (!entry.options?.slot) {
          // no slot, including regardless
          return [entry];
        }
        if (isPrioritizedSlot(entry.options.slot)) {
          // already picked when inserted prioritized middleware, excluding
          return [];
        }
        // this declaration holds the position, an inner one may own the slot
        const middleware = resolveSlot(entry.options.slot);
        return middleware //
          ? [middleware]
          : [];
      }),

      ...definitionItems.flatMap((entry) => {
        const slot =
          entry.kind === "middleware" //
            ? entry.options?.slot
            : undefined;

        if (slot) {
          if (isPrioritizedSlot(slot)) {
            // already picked when inserted prioritized middleware, excluding
            return [];
          }
          if (globalMiddleware.some((e) => e.options?.slot === slot)) {
            // already picked when inserted global middleware, excluding
            return [];
          }
          if (routeMiddleware.find((e) => e.options?.slot === slot) !== entry) {
            // an outer declaration already holds this slot's position, excluding
            return [];
          }
          // this declaration holds the position, an inner one may own the slot
          const middleware = resolveSlot(slot);
          return middleware //
            ? [middleware]
            : [];
        }

        return [entry];
      }),
    ];

    for (const entry of routeStack) {
      if (entry.kind === "handler") {
        const middleware = routeStack.flatMap((e) => {
          if (e.kind === "middleware") {
            return !e.options?.on || e.options.on.includes(entry.method)
              ? [e]
              : [];
          }
          return [];
        });
        stack.push({
          name,
          path,
          file,
          method: entry.method,
          middleware: [
            ...middleware.flatMap((e) => e.middleware),
            ...entry.middleware,
          ] as Array<never>,
          debug: debugRouteEntry<MiddlewareT>({
            name,
            path,
            file,
            method: entry.method,
            middleware,
            handler: entry,
          }),
        });
      }
    }
  }

  return stack;
};
