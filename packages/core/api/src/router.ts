import { debugRouteEntry } from "./debug";
import type {
  HandlerDefinition,
  MiddlewareDefinition,
  RouterRoute,
  RouterRouteSource,
  UseSlots,
  ValidationSchemas,
} from "./types";

export const createRouterRoutes = <MiddlewareT, MiddlewareR>(
  routeSources: Array<RouterRouteSource<MiddlewareT>>,
  // Global middleware applied to every route (e.g., logging)
  globalMiddleware: Array<MiddlewareDefinition<MiddlewareT>>,
  {
    createParamsMiddleware,
    createValidationMiddleware,
  }: {
    createParamsMiddleware: (
      params: RouterRouteSource<MiddlewareT>["params"],
      numericParams: RouterRouteSource<MiddlewareT>["numericParams"],
    ) => Array<MiddlewareDefinition<MiddlewareT>>;
    createValidationMiddleware: (
      validationSchemas: ValidationSchemas,
    ) => Array<MiddlewareDefinition<MiddlewareT>>;
  },
): Array<RouterRoute<MiddlewareR>> => {
  // NOTE:: prioritized middleware must run in this exact order!
  const prioritizedSlots: Array<keyof UseSlots> = [
    "errorHandler",
    "params",
    "validateParams",
    "bodyparser",
    "payload",
    "validatePayload",
    "validateResponse",
  ];

  const stack: Array<RouterRoute<MiddlewareR>> = [];

  // Iterate over each route definition
  for (const { name, path, file, ...rest } of routeSources) {
    // Include both middleware and HTTP method handlers
    const definitionItems = [
      ...rest.useWrappers,
      ...rest.definitionItems,
    ].flat();

    const routeMiddleware: Array<MiddlewareDefinition<MiddlewareT>> =
      definitionItems.filter((e) => e.kind === "middleware");

    const middlewareStack: Array<MiddlewareDefinition<MiddlewareT>> = [
      ...createParamsMiddleware(rest.params, rest.numericParams),
      ...createValidationMiddleware(rest.validationSchemas),
      ...globalMiddleware,
      // route middleware overrides global middleware (of same slot)
      ...routeMiddleware,
    ];

    // NOTE: later defined middleware should override previous middleware of same slot
    const routeStack: Array<
      MiddlewareDefinition<MiddlewareT> | HandlerDefinition<MiddlewareT>
    > = [
      ...prioritizedSlots.flatMap((slot) => {
        const middleware = middlewareStack.findLast(
          // Using findLast to pick the latest entry,
          // ensuring later entries override earlier ones.
          (e) => e.options?.slot === slot,
        );
        return middleware //
          ? [middleware]
          : [];
      }),

      ...globalMiddleware.flatMap((entry) => {
        if (!entry.options?.slot) {
          // no slot, including regardless
          return [entry];
        }
        if (prioritizedSlots.includes(entry.options?.slot)) {
          // already picked when inserted prioritized middleware, excluding
          return [];
        }
        const override = routeMiddleware.findLast(
          // Using findLast to pick the latest entry,
          // ensuring later entries override earlier ones.
          (e) => e.options?.slot === entry.options?.slot,
        );
        return [override || entry];
      }),

      ...definitionItems.flatMap((entry) => {
        const slot =
          entry.kind === "middleware" //
            ? entry.options?.slot
            : undefined;

        if (slot) {
          if (prioritizedSlots.includes(slot)) {
            // already picked when inserted prioritized middleware, excluding
            return [];
          }
          if (globalMiddleware.some((e) => e.options?.slot === slot)) {
            // already picked when inserted core middleware, excluding
            return [];
          }
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
          methods: [entry.method],
          middleware: [
            ...middleware.flatMap((e) => e.middleware),
            ...entry.middleware,
          ] as Array<never>,
          debug: debugRouteEntry<MiddlewareT>({
            name,
            path,
            file,
            methods: [entry.method],
            middleware,
            handler: entry,
          }),
        });
      }
    }
  }

  return stack;
};
