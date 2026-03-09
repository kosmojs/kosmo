import type { ParameterizedContext } from "{{ createImport 'libApi' }}";

type ErrorHandler = (
  error: any,
  ctx: ParameterizedContext<never, {}, {}>,
) => Promise<Response> | Response;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
