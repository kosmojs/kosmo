import Type from "typebox";
import { Compile } from "typebox/compile";
import Value from "typebox/value";

import type { ValidationSchema, ValidationTarget } from "@kosmojs/api";
import { ValidationError } from "@kosmojs/api/errors";

import errorHandlerFactory from "./error-handler";

import {
  customTypes,
  validationMessages,
} from "{{ createImport 'lib' '@typebox/setup' }}";

const {
  formatValidationErrors,
  formatValidationErrorMessage,
  getErrorSummary,
} = errorHandlerFactory(validationMessages);

export const validationSchemaFactory = (
  schemaText: string,
  { target, route }: { target: ValidationTarget | "params"; route: string },
): ValidationSchema => {
  const schema = Type.Script(customTypes, schemaText);
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
          },
        ]);
      }
    },
  };
};
