import type { Context } from "hono";

import type { AppEnv } from "./app";

type ErrorHandler = (
  error: any,
  ctx: Context<AppEnv>,
) => Promise<Response> | Response;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
