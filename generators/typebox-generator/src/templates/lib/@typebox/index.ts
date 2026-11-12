import type { TSchema } from "typebox";
import { Compile } from "typebox/compile";
import Value from "typebox/value";

import type {
  JsonSchema,
  ValidationSchema,
  ValidationTarget,
} from "@kosmojs/core";
import { ValidationError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "./error-handler";
import { customTypes, validationMessages } from "./setup";

const {
  formatValidationErrors,
  formatValidationErrorMessage,
  getErrorSummary,
} = errorHandlerFactory(validationMessages);

const isObject = (value: unknown): value is JsonSchema => {
  return Boolean(value) && typeof value === "object";
};

/**
 * The schema with the custom types in place: a type the runtime supplies
 * (Date, File, Blob, Buffer, ArrayBuffer, or one added in setup)
 * stays a `{ $ref: "<name>" }` at build time and is replaced here.
 * A `$ref` still pointing nowhere is a type that could not be resolved,
 * and would reject every value - it fails here, naming the route and the type.
 * */
const resolveCustomTypes = (
  schema: JsonSchema,
  { target, route }: { target: string; route: string },
): TSchema => {
  const custom = customTypes as Record<string, TSchema>;

  const visit = (node: unknown, scope: ReadonlySet<string>): unknown => {
    if (Array.isArray(node)) {
      return node.map((e) => visit(e, scope));
    }

    if (!isObject(node)) {
      return node;
    }

    const defs = isObject(node.$defs)
      ? new Set([...scope, ...Object.keys(node.$defs)])
      : scope;

    if (typeof node.$ref === "string" && !defs.has(node.$ref)) {
      const replacement = custom[node.$ref];
      if (!replacement) {
        throw new Error(
          `${route}: the ${target} schema references "${node.$ref}", a type that could not be resolved`,
        );
      }
      const { $ref, ...options } = node;
      return Object.keys(options).length
        ? { ...replacement, ...options }
        : replacement;
    }

    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, visit(v, defs)]),
    );
  };

  return visit(schema, new Set()) as TSchema;
};

export const validationSchemaFactory = (
  jsonSchema: JsonSchema,
  { target, route }: { target: ValidationTarget | "params"; route: string },
): ValidationSchema => {
  const schema = resolveCustomTypes(jsonSchema, { target, route });
  const compiledSchema = Compile(schema);
  const getSchemaErrors = (data: unknown) => Value.Errors(schema, data);
  return {
    check(data) {
      return compiledSchema.Check(data);
    },
    errors(data) {
      return formatValidationErrors(getSchemaErrors(data));
    },
    errorMessage(data) {
      return formatValidationErrorMessage(getSchemaErrors(data));
    },
    errorSummary(data) {
      return getErrorSummary(getSchemaErrors(data));
    },
    validate(data) {
      if (!this.check(data)) {
        throw new ValidationError([
          target,
          {
            errors: this.errors(data),
            errorMessage: this.errorMessage(data),
            errorSummary: this.errorSummary(data),
            route,
            data,
          },
        ]);
      }
    },
  };
};
