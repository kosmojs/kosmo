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
