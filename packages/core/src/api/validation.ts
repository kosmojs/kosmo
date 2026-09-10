import { ValidationError } from "../errors";
import {
  RequestBodyTargets,
  type RequestValidationTarget,
  type ValidationErrorEntry,
  type ValidationSchema,
} from "../types";
import type { HTTPMethod, ResponseResolver, RouteSource } from "./types";
import { use } from "./use";

export const StateKey = Symbol("kosmo.state");

export const createValidationMiddleware = <T>(
  routeSource: RouteSource<T>,
  {
    productionBuild,
    responseResolver,
  }: {
    productionBuild: boolean;
    responseResolver: ResponseResolver;
  },
) => {
  const { name, validationSchemas } = routeSource;

  if (!validationSchemas) {
    return [];
  }

  const validationTargets: Array<
    [RequestValidationTarget, "metaparser" | "bodyparser"]
  > = [
    ["params", "metaparser"],
    ["query", "metaparser"],
    ["headers", "metaparser"],
    ["cookies", "metaparser"],
    ["json", "bodyparser"],
    ["form", "bodyparser"],
    ["raw", "bodyparser"],
  ];

  /**
   * Request validation - dynamically create one middleware per target
   * (query, headers, cookies, json, form, raw).
   *
   * Each middleware:
   * 1. Checks if a schema exists for the current HTTP method
   * 2. Skips if `runtimeValidation` is explicitly disabled
   * 3. Loads data via the appropriate source provided by metaparsers/bodyparsers.
   * 4. Validates via `schema.validate()` which throws on failure
   *
   * Middleware are assigned named slots (e.g. "validate:params", "validate:json")
   * so they can be replaced by user-defined middleware in the stack.
   *
   * All validation errors are thrown as `ValidationError` instances,
   * caught and formatted by the global error handler middleware upstream.
   * */
  const validationMiddleware = validationTargets.map(([target, key]) => {
    return use(
      async (
        // biome-ignore lint: any
        ctx: any,
        next: Function,
      ) => {
        const method = ctx.metaparser.method();

        const validate = (schema: ValidationSchema, value: unknown) => {
          if (typeof schema?.validate !== "function") {
            throw new Error(
              `${name}: malformed ${target} schema for ${method} - no validate()`,
            );
          }
          schema.validate(value);
        };

        if (target === "params") {
          const value = ctx[key][target]();
          validate(validationSchemas[target] as never, value);
          ctx[StateKey].set(`validated:${target}`, value);
        } else {
          const schema =
            method === "HEAD"
              ? validationSchemas[target]?.GET
              : validationSchemas[target]?.[method];

          if (schema && schema.runtimeValidation !== false) {
            // keep this inside branch to load only when a schema defined.
            const value = RequestBodyTargets[target as never]
              ? await ctx[key][target]()
              : ctx[key][target]();

            validate(schema, value);

            ctx[StateKey].set(`validated:${target}`, value);
          }
        }

        return next();
      },
      {
        slot: `validate:${target}`,
        ...(target === "params"
          ? {
              // params validates regardless method;
            }
          : {
              // run only on methods that defined a schema for current target;
              // an empty array means it runs nowhere.
              on: Object.keys(
                validationSchemas[target] || {},
              ) as Array<HTTPMethod>,
            }),
      },
    );
  });

  validationMiddleware.push(
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
      async function useValidateResponse(
        // biome-ignore lint: any
        ctx: any,
        next: Function,
      ) {
        const method = ctx.metaparser.method();

        const variants =
          validationSchemas.response?.[method === "HEAD" ? "GET" : method] ||
          [];

        if (!Array.isArray(variants) || !variants.length) {
          return next();
        }

        // options are same for all variants
        const { runtimeValidation, customErrors } = variants[0];

        if (productionBuild) {
          // production build - skip if undefined or explicitly set to false
          if (runtimeValidation === undefined || runtimeValidation === false) {
            return next();
          }
        } else {
          // dev mode - skip only if explicitly set to false
          if (runtimeValidation === false) {
            return next();
          }
        }

        // run all downstream middleware (including the route handler)
        const maybeBody = await next();

        const {
          //
          status,
          contentType,
          body,
        } = responseResolver(ctx, maybeBody);

        const response: {
          status: number;
          contentType: string | null;
          body?: unknown;
        } = { status, contentType };

        // validate only 2xx responses
        if (Math.floor(response.status / 100) !== 2) {
          return;
        }

        // RFC 9110 §6.4.1 - content presence depends on method and status
        const skipBodyValidation =
          method === "HEAD" ||
          [204, 205].includes(response.status) ||
          variants.some((e) => e.contentType?.includes("json")) === false;

        if (!skipBodyValidation) {
          response.body = await body();
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
                // no body schema or response is bodyless
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
        // run only on methods that defined a schema for response target
        // an empty array means it runs nowhere.
        on: Object.keys(validationSchemas.response || {}) as Array<HTTPMethod>,
      },
    ),
  );

  return validationMiddleware;
};
