import type { Middleware } from "h3";

import type {
  RequestBodyTarget,
  RequestMetadataTarget,
  RequestValidationTarget,
  ValidationErrorEntry,
} from "@kosmojs/core";
import {
  type CreateRouteMiddleware,
  createRoutes,
  type HTTPMethod,
  StateKey,
} from "@kosmojs/core/api";
import { ValidationError } from "@kosmojs/core/errors";

import {
  type DefaultContext,
  type ParameterizedEvent,
  type ParameterizedMiddleware,
  use,
} from "../api";
import { bodyparsers, metaparsers } from "./parsers";
import { routeSources } from "./routes";

import globalMiddleware from "{{ createImport 'api' 'use' }}";

/**
 * Create route-level middleware stack that handles:
 * 1. Context extension - adds `event.bodyparser` (lazy, cached) and `event.validated` accessors
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
> = ({ name, validationSchemas, normalizeParams, normalizeSearchParams }) => {
  const validationMiddleware = [
    /**
     * Extends H3 event with:
     *
     * - `event.metaparser[target]()` - lazy, cached meta parsers.
     *   Each parser (query, headers, cookies) runs at most once per request;
     *   subsequent calls return the cached result.
     *
     * - `event.bodyparser[target](opts?)` - lazy, cached body parsers.
     *   Each parser (json, form, raw) runs at most once per request;
     *   subsequent calls return the cached result.
     *   This allows both user middleware/handlers and validators
     *   to call the same parser without re-consuming the request stream.
     *
     * - `event.validated` - getter that returns all validated data collected so far
     *   (params, query, headers, cookies, json etc.) as a plain object.
     *
     * Cache is stored on `event[StateKey]` (a Symbol-keyed Map) to keep it
     * hidden from public API surface and serialization.
     * */
    use(
      function useExtendContext(event, next) {
        if (!event[StateKey]) {
          // initialize per-request cache with empty params
          // (later populated by useValidateParams)
          event[StateKey] = new Map([["params", {}]]);

          Object.defineProperty(event, "metaparser", {
            value: Object.entries(metaparsers).reduce<{
              [T in RequestMetadataTarget]?: () => unknown;
            }>((map, entry) => {
              const [target, parser] = entry as [
                RequestMetadataTarget,
                Function,
              ];
              map[target] = () => {
                if (!event[StateKey].has(target)) {
                  event[StateKey].set(
                    target,
                    target === "query"
                      ? normalizeSearchParams(
                          parser(event),
                          event.req.method as never,
                        )
                      : parser(event),
                  );
                }
                return event[StateKey].get(target);
              };
              return map;
            }, {}),
            enumerable: true,
          });

          Object.defineProperty(event, "bodyparser", {
            value: Object.entries(bodyparsers).reduce<{
              [T in RequestBodyTarget]?: () => Promise<unknown>;
            }>((map, entry) => {
              const [target, parser] = entry as [RequestBodyTarget, Function];
              map[target] = async () => {
                if (!event[StateKey].has(target)) {
                  event[StateKey].set(target, await parser(event));
                }
                return event[StateKey].get(target);
              };
              return map;
            }, {}),
            enumerable: true,
          });

          Object.defineProperty(event, "validated", {
            get() {
              return Object.fromEntries(event[StateKey]);
            },
            enumerable: true,
          });
        }
        return next();
      },
      { slot: "@extendContext" },
    ) as never,

    /**
     * Normalize and validate URL params:
     * - Splat params (e.g. `/files{/*path}`) are split into arrays by "/"
     * - Numeric params are cast to Number (or array of Numbers for splat params)
     * - Non-splat, non-numeric params pass through as strings
     *
     * Validated params are stored in the cache so `event.validated.params`
     * reflects the normalized (and validated) values.
     * */
    use(
      function useValidateParams(event, next) {
        const normalizedParams = normalizeParams(event.url.pathname);
        validationSchemas.params?.validate(normalizedParams);
        event[StateKey].set("params", normalizedParams);
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
      async function useValidateResponse(event, next) {
        const variants = validationSchemas.response?.[event.req.method] || [];

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
        const body = await next();

        /**
         * H3 builds the actual Response AFTER the middleware chain completes,
         * so at this point event.res only reflects what handlers set explicitly.
         * Reconstruct what will be sent instead: a returned Response is authoritative;
         * otherwise an unset status means 200, and the content type follows H3's
         * serialization rules for the returned value (string -> text, object -> JSON).
         * */
        const rawResponse = body instanceof Response ? body : undefined;

        const response: {
          status: number;
          contentType: string | null;
          body?: unknown;
        } = {
          status: rawResponse?.status ?? event.res.status ?? 200,
          contentType:
            rawResponse?.headers.get("Content-Type") ??
            event.res.headers.get("Content-Type") ??
            (typeof body === "string"
              ? "text/plain"
              : body === undefined || body === null
                ? null
                : "application/json"),
        };

        // Validate body only for JSON variants
        if (variants.some((e) => e.contentType?.includes("json"))) {
          response.body = rawResponse
            ? await rawResponse
                .clone()
                .json()
                .catch(() => undefined)
            : body;
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
                    message: `expected: ${schema.status}; actual: ${response.status}`,
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
   * 3. Loads data via the appropriate source (event.query, event.headers, or event.bodyparser)
   * 4. Validates via `schema.validate()` which throws on failure
   *
   * Body targets (json, form, raw) go through `event.bodyparser[target]()`,
   * benefiting from the lazy parsing and caching set up by slot:extendContext middleware.
   *
   * All request validators are active on any HTTP method that has at least one
   * schema defined across any target - this is intentionally broad to avoid
   * silently skipping validation when methods overlap.
   * */
  const requestTargets: Record<
    RequestValidationTarget,
    (
      event: ParameterizedEvent<Record<string, string>, DefaultContext>,
    ) => Promise<unknown>
  > = {
    query: async (event) => event.metaparser.query(),
    headers: async (event) => event.metaparser.headers(),
    cookies: async (event) => event.metaparser.cookies(),
    json: async (event) => event.bodyparser.json(),
    form: async (event) => event.bodyparser.form(),
    raw: async (event) => event.bodyparser.raw(),
  };

  const requestEntries = Object.entries(requestTargets) as Array<
    [RequestValidationTarget, (typeof requestTargets)[RequestValidationTarget]]
  >;

  for (const [target, loadData] of requestEntries) {
    validationMiddleware.push(
      use(
        async (event, next) => {
          const schema = {
            ...validationSchemas[target]?.[event.req.method],
          };
          if (schema.validate && schema.runtimeValidation !== false) {
            schema.validate(await loadData(event as never));
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

export const routes = createRoutes<ParameterizedMiddleware, Middleware>(
  routeSources,
  {
    globalMiddleware: globalMiddleware as never,
    createRouteMiddleware,
  },
);
