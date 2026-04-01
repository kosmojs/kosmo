import type { ResolvedType } from "tfusion";

import type { HTTPMethod } from "../api";

/**
 * Request metadata validation targets.
 * */
export const RequestMetadataTargets = {
  query: "URL query parameters",
  headers: "HTTP request headers",
  cookies: "HTTP cookies",
} as const;

/**
 * Request body validation targets.
 *
 * Body formats are mutually exclusive - only one should be specified per handler.
 *
 * **Development behavior:**
 * - If multiple formats are defined, the builder displays a warning and
 *   disables validation schemas for the affected handler.
 * - If an unsuitable target is defined (e.g., `json`, `form`)
 *   for a method without a body like GET, HEAD), a warning is displayed and
 *   validation schemas are disabled for that handler.
 *
 * This ensures misconfigurations are detected during development
 * for runtime to execute without false positive validation failures.
 *
 * Always define exactly one target that is suitable for current handler.
 * */
export const RequestBodyTargets = {
  json: "JSON request body",
  form: "URL-encoded or Multipart form",
  raw: "Raw body format (string/Buffer/ArrayBuffer/Blob)",
} as const;

export const RequestValidationTargets = {
  ...RequestMetadataTargets,
  ...RequestBodyTargets,
} as const;

export type RequestMetadataTarget = keyof typeof RequestMetadataTargets;
export type RequestBodyTarget = keyof typeof RequestBodyTargets;
export type RequestValidationTarget = keyof typeof RequestValidationTargets;

export type ValidationTarget = RequestValidationTarget | "params" | "response";

export type ValidationDefmap = Partial<{
  /**
   * Request metadata targets.
   * */
  query: Record<string, unknown>;
  headers: Record<string, string>;
  cookies: Record<string, unknown>;

  /**
   * Request body targets. One target per handler.
   *
   * POST<
   *   json: { id: number }
   *   // or form/raw
   * >((ctx) => {})
   * */
  json: unknown;
  form: Record<string, unknown>;
  raw: string | Buffer | ArrayBuffer | Blob;

  /**
   * Response variants.
   * Multiple variants can be specified via unions.
   *
   * POST<
   *   response:
   *     | [200, "json", User]
   *     | [201, "json"]
   *     | [301]
   * >((ctx) => {})
   * */
  response: [
    /**
     * HTTP status code to send with the response.
     * Common values: 200 (OK), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)
     * */
    status: number,
    /**
     * Content-Type header for the response. Supports shorthand notation that gets
     * resolved via mime-types lookup (e.g., "json" becomes "application/json",
     * "html" becomes "text/html", "png" becomes "image/png")
     * */
    contentType?: string | undefined,
    /** The response body schema */
    body?: unknown,
  ];
}>;

export type ValidationCustomErrors = {
  /**
   * Custom error messages for validation failures.
   *
   * Use `error` to set a general error message for the entire validation target.
   * Use `error.<fieldName>` to set specific error messages for individual fields.
   *
   * @example Override validation error messages
   * POST<{
   *   json: {
   *     id: number;
   *     email: string;
   *     age: number;
   *   }
   * }, {
   *   json: {
   *     error: "Invalid user data provided",
   *     "error.id": "User ID must be a valid number",
   *     "error.email": "Please provide a valid email address",
   *     "error.age": "Age must be a number"
   *   }
   * }>
   * */
  error?: string;
} & {
  [E in `error.${string}`]?: string;
};

export type ValidationOptions = {
  /**
   * Controls runtime validation for this target.
   *
   * By default, all validation targets are validated at runtime. Set this to
   * `false` if you only need compile-time type checking without runtime validation.
   *
   * @example Disable runtime validation for JSON payload
   * POST<{
   *   json: Payload<User>
   * }, {
   *   json: {
   *     runtimeValidation: false
   *   }
   * }>
   * */
  runtimeValidation?: boolean | undefined;

  /**
   * Specifies the request Content-Type for OpenAPI schema generation.
   *
   * When the validation target is `form`, the OpenAPI generator will include
   * both `application/x-www-form-urlencoded` and `multipart/form-data` in the
   * request body content types by default. This indicates the handler accepts
   * either format, which may not be accurate for your use case.
   *
   * Use this option to explicitly declare which content type your handler expects.
   * */
  contentType?: string;
} & ValidationCustomErrors;

export type ValidationOptmap = {
  [K in ValidationTarget]?: ValidationOptions;
};

/**
 * Shape of individual validation errors emitted by generators.
 * */
export type ValidationErrorEntry = {
  /**
   * JSON Schema keyword that triggered the error
   * (e.g. `format`, `maxItems`, `maxLength`).
   * */
  keyword: string;
  /**
   * JSON Pointer–style path to the invalid field
   * (matches JSON Schema `instancePath`).
   * */
  path: string;
  /**
   * Human-readable error message.
   * */
  message: string;
  /**
   * Constraint parameters (e.g. `{ limit: 5 }`, `{ format: "email" }`).
   * */
  params?: Record<string, unknown>;
  /**
   * Optional error code for i18n/l10n or custom handling.
   * */
  code?: string;
};

export type ValidationErrorData = {
  errors: Array<ValidationErrorEntry>;
  /**
   * Formats errors into a single human-readable message.
   * @example: Validation failed: user: missing required properties:
   * "email", "name"; password: must be at least 8 characters long
   * */
  errorMessage: string;
  /**
   * Gets a simple error summary for quick feedback.
   * @example: 2 validation errors found across 2 fields
   * */
  errorSummary: string;

  // route name
  route: string;

  // data that did not pass validation
  data: unknown;
};

export type ValidationSchema = {
  check: (data: unknown) => boolean;
  errors: (data: unknown) => Array<ValidationErrorEntry>;
  errorMessage: (data: unknown) => string;
  errorSummary: (data: unknown) => string;
  validate: (data: unknown) => void;
};

export type ValidationSchemas<Extend = object> = {
  [T in RequestValidationTarget]?: Record<
    // http method
    string,
    ValidationSchema &
      Extend & {
        runtimeValidation?: boolean;
        customErrors?: ValidationCustomErrors;
      }
  >;
} & {
  params?: ValidationSchema & Extend;
  response?: Record<
    // http method
    string,
    Array<
      ValidationSchema &
        Extend & {
          status: number;
          contentType?: string;
          runtimeValidation?: boolean;
          customErrors?: ValidationCustomErrors;
        }
    >
  >;
};

export type ValidationDefinition = {
  method: HTTPMethod;
  runtimeValidation?: boolean | undefined;
  customErrors?: Record<string, string> | undefined;
} & (
  | {
      target: "response";
      variants: Array<{
        id: string;
        status: number;
        contentType: string | undefined;
        body: string | undefined;
        resolvedType?: ResolvedType | undefined;
      }>;
    }
  | {
      target: Exclude<ValidationTarget, "response">;
      contentType?: string | undefined;
      schema: {
        id: string;
        text: string;
        resolvedType?: ResolvedType | undefined;
      };
    }
);

export type RequestValidationDefinition = Exclude<
  ValidationDefinition,
  { target: "response" }
>;

export type ResponseValidationDefinition = Extract<
  ValidationDefinition,
  { target: "response" }
>;
