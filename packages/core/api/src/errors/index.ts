import type { ValidationTarget } from "../types";
import type { ValidationErrorData, ValidationErrorEntry } from "./types";

export * from "./types";

/**
 * Standardized error wrapper used by validation generators.
 *
 * Instances of this class are thrown whenever validation fails,
 * carrying both the validation target and the list of validation error details.
 * */
export class ValidationError extends Error {
  public target: ValidationTarget;
  public errors: Array<ValidationErrorEntry> = [];
  public errorMessage: string;
  public errorSummary: string;
  public route: string;
  public data: unknown;

  constructor([target, { errors, errorMessage, errorSummary, route, data }]: [
    ValidationTarget,
    ValidationErrorData,
  ]) {
    super(JSON.stringify(errors, null, 2));
    this.name = `${target}ValidationError`;
    this.target = target;
    this.errors = errors;
    this.errorMessage = errorMessage;
    this.errorSummary = errorSummary;
    this.route = route;
    this.data = data;
  }
}
