import type { ParameterizedMiddleware } from "../api";

export type ErrorHandlerFactory = (
  h: ParameterizedMiddleware,
) => ParameterizedMiddleware;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
