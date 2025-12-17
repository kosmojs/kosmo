import Router, { type RouterMiddleware } from "@koa/router";

import debugRouteEntry from "./debug";
import type {
  CreateRouter,
  DefineRoute,
  HandlerDefinition,
  MiddlewareDefinition,
  RouterRoute,
  RouterRouteSource,
  UseSlots,
  ValidationSchemas,
} from "./types";
import { use } from "./use";

export const createRouter: CreateRouter = (options) => {
  return new Router(options);
};

export const defineRoute: DefineRoute = (factory) => {
  return factory({
    use(middleware, options) {
      return {
        kind: "middleware",
        middleware: [middleware as never].flat(),
        options,
      };
    },
    HEAD(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "HEAD",
      };
    },
    OPTIONS(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "OPTIONS",
      };
    },
    GET(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "GET",
      };
    },
    POST(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "POST",
      };
    },
    PUT(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "PUT",
      };
    },
    PATCH(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "PATCH",
      };
    },
    DELETE(middleware) {
      return {
        kind: "handler",
        middleware: [middleware as never].flat(),
        method: "DELETE",
      };
    },
  });
};

export const routerRoutesFactory = (
  routeSources: Array<RouterRouteSource>,
  {
    // Global middleware applied to every route (e.g., logging)
    coreMiddleware,
  }: {
    coreMiddleware: Array<MiddlewareDefinition>;
  },
): Array<RouterRoute> => {
  // WARN:: prioritized middleware must run in this exact order!
  const prioritizedSlots: Array<keyof UseSlots> = [
    "errorHandler",
    "params", // Path params processing
    "validateParams", // Path params validation
    "bodyparser", // Raw request body parsing
    "payload", // Set ctx.payload
    "validatePayload", // Payload validation
    "validateResponse", // Response validation
  ];

  const stack: Array<RouterRoute> = [];

  // Iterate over each route definition
  for (const { name, path, file, ...rest } of routeSources) {
    // Include both middleware and HTTP method handlers
    const definitionItems = [
      ...rest.useWrappers,
      ...rest.definitionItems,
    ].flat();

    const routeMiddleware: Array<MiddlewareDefinition> = definitionItems.filter(
      (e) => e.kind === "middleware",
    );

    // WARN: the order is critical!
    // the last defined middleware will take precedence.
    const middlewareStack: Array<MiddlewareDefinition> = [
      ...paramsMiddlewareFactory(rest.params, rest.numericParams),
      ...validationMiddlewareFactory(rest.validationSchemas),
      // core middleware overrides builtin middleware (of same slot)
      ...coreMiddleware,
      // route middleware overrides core middleware (of same slot)
      ...routeMiddleware,
    ];

    const routeStack: Array<MiddlewareDefinition | HandlerDefinition> = [
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

      ...coreMiddleware.flatMap((entry) => {
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
          if (coreMiddleware.some((e) => e.options?.slot === slot)) {
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
          ] as unknown as Array<RouterMiddleware>,
          debug: debugRouteEntry({
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

const paramsMiddlewareFactory = (
  params: RouterRouteSource["params"],
  numericParams: RouterRouteSource["numericParams"],
) => [
  use(
    function useParams(ctx, next) {
      ctx.typedParams = params.reduce(
        (map: Record<string, unknown>, [name, isRest]) => {
          const value = ctx.params[name];
          if (value) {
            if (isRest) {
              map[name] = numericParams.includes(name)
                ? value.split("/").map(Number)
                : value.split("/");
            } else {
              map[name] = numericParams.includes(name) ? Number(value) : value;
            }
          } else {
            map[name] = value;
          }
          return map;
        },
        {},
      ) as never;
      return next();
    },
    { slot: "params" },
  ),
];

const validationMiddlewareFactory = (validationSchemas: ValidationSchemas) => [
  use(
    function useValidateParams(ctx, next) {
      validationSchemas.params?.validate(ctx.typedParams);
      return next();
    },
    { slot: "validateParams" },
  ),

  use(
    function useValidatePayload(ctx, next) {
      validationSchemas.payload?.[ctx.method]?.validate(ctx.payload);
      return next();
    },
    {
      slot: "validatePayload",
      on: Object.keys(validationSchemas.payload || {}) as never,
    },
  ),

  use(
    async function useValidateResponse(ctx, next) {
      if (validationSchemas.response?.[ctx.method]) {
        await next();
        validationSchemas.response?.[ctx.method]?.validate(ctx.body);
      } else {
        return next();
      }
    },
    {
      slot: "validateResponse",
      on: Object.keys(validationSchemas.response || {}) as never,
    },
  ),
];
