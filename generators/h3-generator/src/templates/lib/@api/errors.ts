import { type H3Event, HTTPError } from "h3";

import { ValidationError } from "@kosmojs/core/errors";

type ErrorHandler = (
  error: any,
  event: H3Event,
) => Promise<Response> | Response;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  // H3 wraps errors in its own HTTPError with the original error as `cause`
  return (error, event) => {
    return handler(
      error instanceof HTTPError
        ? error.cause instanceof ValidationError
          ? error.cause
          : error
        : error,
      event,
    );
  };
};
