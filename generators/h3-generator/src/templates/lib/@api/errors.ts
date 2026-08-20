import type { H3Event } from "h3";

type ErrorHandler = (
  error: any,
  event: H3Event,
) => Promise<Response> | Response;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
