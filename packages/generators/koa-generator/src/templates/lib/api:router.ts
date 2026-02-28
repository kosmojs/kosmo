import KoaRouter, { type RouterMiddleware } from "@koa/router";
import { parseCookie } from "cookie";

import {
  type CreateRouteMiddleware,
  createRouterRoutes,
  type HTTPMethod,
  type RequestBodyTarget,
  type RequestValidationTarget,
  type RouterFactory,
  StateKey,
} from "@kosmojs/api";
import {
  ValidationError,
  type ValidationErrorEntry,
} from "@kosmojs/api/errors";

import {
  type DefaultContext,
  type DefaultState,
  type ParameterizedContext,
  type ParameterizedMiddleware,
  use,
} from "./api";
import { type BodyparserOptions, bodyparsers } from "./api:bodyparser";

import globalMiddleware from "{{ createImport 'api' 'use' }}";
import { routeSources } from "{{ createImport 'lib' 'api:routes' }}";

const devMode = () => {
  return ["development", "test"].includes(process.env.NODE_ENV ?? "");
};

export type Router = import("@koa/router").Router<DefaultState, DefaultContext>;
export type RouterOptions = import("@koa/router").RouterOptions;

/**
 * Create route-level middleware stack that handles:
 * 1. Context extension - adds `ctx.bodyparser` (lazy, cached) and `ctx.validated` accessors
 * 2. Params validation - normalizes and validates URL params (including splat/numeric params)
 * 3. Request validation - validates query, headers, cookies, and body against schemas
 * 4. Response validation - validates outgoing response against defined variants
 *
 * Middleware are assigned named slots (e.g. "validate:params", "validate:json")
 * so they can be replaced by user-defined middleware in the stack.
 *
 * All validation errors are thrown as `ValidationError` instances,
 * caught and formatted by the global error handler middleware upstream.
 * */
export const createRouteMiddleware: CreateRouteMiddleware<
  ParameterizedMiddleware
> = ({ route, validationSchemas, params, numericParams }) => {
  const validationMiddleware = [
    /**
     * Extends Koa context with:
     *
     * - `ctx.bodyparser[target](opts?)` - lazy, cached body parsers.
     *   Each parser (json, form, raw) runs at most once per request;
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
    use(
      function useExtendContext(ctx, next) {
        // initialize per-request cache with empty params
        // (later populated by useValidateParams)
        ctx[StateKey] = new Map([["params", {}]]);
        Object.defineProperty(ctx, "bodyparser", {
          value: Object.entries(bodyparsers).reduce<{
            [T in RequestBodyTarget]?: (
              opt?: BodyparserOptions[T],
            ) => Promise<unknown>;
          }>((map, entry) => {
            const [target, parser] = entry as [RequestBodyTarget, Function];
            map[target] = async (opt) => {
              if (!ctx[StateKey].has(target)) {
                ctx[StateKey].set(target, await parser(ctx, opt as never));
              }
              return ctx[StateKey].get(target);
            };
            return map;
          }, {}),
          enumerable: true,
        });
        Object.defineProperty(ctx, "validated", {
          get() {
            return Object.fromEntries(ctx[StateKey]);
          },
          enumerable: true,
        });
        return next();
      },
      { slot: "extendContext" },
    ) as never,

    /**
     * Normalize and validate URL params:
     * - Splat params (e.g. `/files{/*path}`) are split into arrays by "/"
     * - Numeric params are cast to Number (or array of Numbers for splat params)
     * - Non-splat, non-numeric params pass through as strings
     *
     * Validated params are stored in the cache so `ctx.validated.params`
     * reflects the normalized (and validated) values.
     * */
    use(
      function useValidateParams(ctx, next) {
        const normalizedParams = params.reduce(
          (map: Record<string, unknown>, [name, isSplat]) => {
            const value = ctx.params[name];
            if (value) {
              if (isSplat) {
                map[name] = numericParams.includes(name)
                  ? value.split("/").map(Number)
                  : value.split("/");
              } else {
                map[name] = numericParams.includes(name)
                  ? Number(value)
                  : value;
              }
            } else {
              map[name] = value;
            }
            return map;
          },
          {},
        );
        validationSchemas.params?.validate(normalizedParams);
        ctx[StateKey].set("params", normalizedParams);
        return next();
      },
      { slot: "validate:params" },
    ) as never,

    /**
     * Response validation - runs AFTER the handler (post-`next()`).
     *
     * Each response schema defines one or more variants, each with:
     * - expected status code
     * - optional content-type
     * - optional body schema
     *
     * All variants are checked; if at least one passes, validation succeeds.
     * If none pass, a ValidationError is thrown with collected errors from all variants.
     *
     * Activation rules:
     * - In dev/test mode: runs unless `runtimeValidation` is explicitly `false`
     * - In production: runs only if `runtimeValidation` is explicitly `true`
     *
     * Only attached to HTTP methods that have response schemas defined.
     * */
    use(
      async function useValidateResponse(ctx, next) {
        const variants = validationSchemas.response?.[ctx.method] || [];

        if (!Array.isArray(variants) || !variants.length) {
          return next();
        }

        // options are same for all variants
        const { runtimeValidation, customErrors } = variants[0];

        if (devMode()) {
          // dev mode, skip only if explicitly set to false
          if (runtimeValidation === false) {
            return next();
          }
        } else {
          // in production, skip if undefined or explicitly set to false
          if (runtimeValidation === undefined || runtimeValidation === false) {
            return next();
          }
        }

        // run all downstream middleware (including the route handler)
        // so ctx.status / ctx.type / ctx.body are set before we validate the response
        await next();

        /**
         * Returns an array of validator functions for a single response variant.
         * Each validator checks one aspect (status, content-type, body)
         * and returns an error entry or undefined if the check passes.
         * */
        const variantValidators: (
          v: (typeof variants)[number],
        ) => Array<(i: number) => ValidationErrorEntry | undefined> = ({
          status,
          contentType,
          schema,
        }) => {
          return [
            (i) => {
              return status === ctx.status
                ? undefined
                : {
                    keyword: "Status",
                    path: `Variant #${i}`,
                    message: `expected: ${status}; actual: ${ctx.status}`,
                  };
            },
            (i) => {
              return !contentType || contentType === ctx.type
                ? undefined
                : {
                    keyword: "ContentType",
                    path: `Variant #${i}`,
                    message: `expected: ${contentType}; actual: ${ctx.type}`,
                  };
            },
            (i) => {
              if (!schema) {
                return;
              }
              return schema.check(ctx.body)
                ? undefined
                : {
                    keyword: "Body",
                    path: `Variant #${i}`,
                    message: schema.errorMessage(ctx.body),
                  };
            },
          ];
        };

        // collect errors across all variants; exit early if any variant passes
        const errors: Array<ValidationErrorEntry> = [];

        for (const [i, variant] of variants.entries()) {
          const variantErrors = variantValidators(variant).flatMap(
            (validator) => {
              const error = validator(i);
              return error ? [error] : [];
            },
          );
          if (!variantErrors.length) {
            // variant fully matched - response is valid
            return;
          }
          errors.push(...variantErrors);
        }

        const errorMessage = `The response did not match any of the expected formats`;
        const errorSummary = `${variants.length} variants checked, none valid`;

        // no variant passed validation
        throw new ValidationError([
          "response",
          {
            errors,
            errorMessage: customErrors?.error || errorMessage,
            errorSummary,
            route,
            data: { status: ctx.status, contentType: ctx.type, body: ctx.body },
          },
        ]);
      },
      {
        slot: "validate:response",
        on: Object.keys(validationSchemas.response || {}) as Array<HTTPMethod>,
      },
    ) as never,
  ];

  /**
   * Request validation - dynamically creates one middleware per target
   * (query, headers, cookies, json, form, raw).
   *
   * Each middleware:
   * 1. Checks if a schema exists for the current HTTP method
   * 2. Skips if `runtimeValidation` is explicitly disabled
   * 3. Loads data via the appropriate source (ctx.query, ctx.headers, or ctx.bodyparser)
   * 4. Validates via `schema.validate()` which throws on failure
   *
   * Body targets (json, form, raw) go through `ctx.bodyparser[target]()`,
   * benefiting from the lazy parsing and caching set up by slot:extendContext middleware.
   *
   * All request validators are active on any HTTP method that has at least one
   * schema defined across any target - this is intentionally broad to avoid
   * silently skipping validation when methods overlap.
   * */
  const requestTargets: Record<
    RequestValidationTarget,
    (
      ctx: ParameterizedContext<
        Record<string, string>,
        DefaultState,
        DefaultContext
      >,
    ) => Promise<unknown>
  > = {
    query: async (ctx) => ctx.query,
    headers: async (ctx) => ctx.headers,
    cookies: async (ctx) => parseCookie(ctx.headers.cookie ?? ""),
    json: async (ctx) => ctx.bodyparser.json(),
    form: async (ctx) => ctx.bodyparser.form(),
    raw: (ctx) => ctx.bodyparser.raw(),
  };

  const requestEntries = Object.entries(requestTargets) as Array<
    [RequestValidationTarget, (typeof requestTargets)[RequestValidationTarget]]
  >;

  for (const [target, loadData] of requestEntries) {
    validationMiddleware.push(
      use(
        async (ctx, next) => {
          const { schema, runtimeValidation } = {
            ...validationSchemas[target]?.[ctx.method],
          };
          if (schema && runtimeValidation !== false) {
            schema.validate(await loadData(ctx));
          }
          return next();
        },
        {
          slot: `validate:${target}`,
          // duplicates not an issue here
          on: requestEntries.flatMap(([target]) => {
            return Object.keys(
              validationSchemas[target] || {},
            ) as Array<HTTPMethod>;
          }),
        },
      ) as never,
    );
  }

  return validationMiddleware;
};

export const routes = createRouterRoutes<
  ParameterizedMiddleware,
  RouterMiddleware
>(routeSources as never, {
  globalMiddleware: globalMiddleware as never,
  createRouteMiddleware,
});

export const routerFactory: RouterFactory<Router, RouterOptions> = (
  factory,
) => {
  const createRouter = (options?: RouterOptions): Router => {
    return new KoaRouter(options);
  };
  return factory({ createRouter });
};
