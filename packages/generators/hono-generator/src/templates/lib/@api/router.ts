import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { Router } from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import { match } from "path-to-regexp";

import type {
  RequestBodyTarget,
  RequestValidationTarget,
  ValidationErrorEntry,
} from "@kosmojs/core";
import {
  type CreateRouteMiddleware,
  createRoutes,
  type HTTPMethod,
  type RouterFactory,
  StateKey,
} from "@kosmojs/core/api";
import { ValidationError } from "@kosmojs/core/errors";

import {
  type DefaultBindings,
  type DefaultVariables,
  type ParameterizedContext,
  type ParameterizedMiddleware,
  use,
} from "../api";
import { type BodyparserOptions, bodyparsers } from "./bodyparser";
import { routeSources } from "./routes";

import globalMiddleware from "{{ createImport 'api' 'use' }}";

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
> = ({ name, pathPattern, params, numericParams, validationSchemas }) => {
  const pathMatcher = match(pathPattern);

  const matchPath = (path: string) => {
    try {
      return pathMatcher(path);
    } catch (_e) {
      return undefined;
    }
  };

  const validationMiddleware = [
    /**
     * Extends Koa context with:
     *
     * - `ctx.bodyparser[target](opts?)` - lazy, cached body parsers.
     *   Each parser (json, form, multipart, raw) runs at most once per request;
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
        if (!ctx[StateKey]) {
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
        }
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
        const matched = matchPath(ctx.req.path);
        const normalizedParams = params.reduce(
          (map: Record<string, unknown>, name) => {
            const value = matched ? matched.params[name] : undefined;
            if (Array.isArray(value)) {
              map[name] = numericParams.includes(name)
                ? value.map(Number)
                : value;
            } else if (value) {
              map[name] = numericParams.includes(name) //
                ? Number(value)
                : value;
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
        const variants = validationSchemas.response?.[ctx.req.method] || [];

        if (!Array.isArray(variants) || !variants.length) {
          return next();
        }

        // options are same for all variants
        const { runtimeValidation, customErrors } = variants[0];

        if (KOSMO_PRODUCTION_BUILD) {
          // skip if undefined or explicitly set to false
          if (runtimeValidation === undefined || runtimeValidation === false) {
            return next();
          }
        } else {
          // skip only if explicitly set to false
          if (runtimeValidation === false) {
            return next();
          }
        }

        // run all downstream middleware (including the route handler)
        await next();

        const response: {
          status: number;
          contentType: string | null;
          body?: unknown;
        } = {
          status: ctx.res.status,
          contentType: ctx.res.headers.get("Content-Type"),
        };

        // Validate body only for JSON variants
        if (variants.some((e) => e.contentType?.includes("json"))) {
          const cloned = ctx.res.clone();
          response.body = await cloned.json();
        }

        /**
         * Returns an array of validator functions for a single response variant.
         * Each validator checks one aspect (status, content-type, body)
         * and returns an error entry or undefined if the check passes.
         * */
        const variantValidators: (
          v: (typeof variants)[number],
        ) => Array<(i: number) => ValidationErrorEntry | undefined> = (
          schema,
        ) => {
          return [
            (i) => {
              return schema.status === response.status
                ? undefined
                : {
                    keyword: "Status",
                    path: `Variant #${i}`,
                    message: `expected: ${schema.status}; actual: ${ctx.status}`,
                  };
            },
            (i) => {
              if (
                !schema.contentType ||
                schema.contentType === response.contentType
              ) {
                return undefined;
              }
              return {
                keyword: "ContentType",
                path: `Variant #${i}`,
                message: `expected: ${schema.contentType}; actual: ${response.contentType}`,
              };
            },
            (i) => {
              if (!schema.check || "body" in response === false) {
                // no body schema or contentType is not JSON
                return;
              }
              return schema.check(response.body)
                ? undefined
                : {
                    keyword: "Body",
                    path: `Variant #${i}`,
                    message: schema.errorMessage(response.body),
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
            route: name,
            data: response,
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
   * (query, headers, cookies, json, form, multipart, raw).
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
        DefaultVariables,
        DefaultBindings
      >,
    ) => Promise<unknown>
  > = {
    query: async (ctx) => ctx.req.queries(),
    headers: async (ctx) => ctx.req.header(),
    cookies: async (ctx) => getCookie(ctx),
    json: async (ctx) => ctx.bodyparser.json(),
    form: async (ctx) => ctx.bodyparser.form(),
    raw: async (ctx) => ctx.bodyparser.raw(),
  };

  const requestEntries = Object.entries(requestTargets) as Array<
    [RequestValidationTarget, (typeof requestTargets)[RequestValidationTarget]]
  >;

  for (const [target, loadData] of requestEntries) {
    validationMiddleware.push(
      use(
        async (ctx, next) => {
          const schema = {
            ...validationSchemas[target]?.[ctx.req.method],
          };
          if (schema.validate && schema.runtimeValidation !== false) {
            schema.validate(await loadData(ctx as never));
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

export const routes = createRoutes<ParameterizedMiddleware, MiddlewareHandler>(
  routeSources,
  {
    globalMiddleware: globalMiddleware as never,
    createRouteMiddleware,
  },
);

export const routerFactory: RouterFactory<Router<never>, never> = (factory) => {
  const createRouter = () => {
    return new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()],
    }) as Router<never>;
  };
  return factory({ createRouter });
};
