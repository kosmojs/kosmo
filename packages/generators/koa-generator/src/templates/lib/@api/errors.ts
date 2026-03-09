import type { ParameterizedMiddleware } from "{{ createImport 'libApi' }}";

export type ErrorHandlerFactory = (
  h: ParameterizedMiddleware,
) => ParameterizedMiddleware;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
