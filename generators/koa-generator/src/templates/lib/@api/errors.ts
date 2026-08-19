import type {
  DefaultContext,
  DefaultState,
  ParameterizedContext,
} from "../api";

type ErrorHandler = (
  error: any,
  ctx: ParameterizedContext<unknown, DefaultState, DefaultContext>,
) => Promise<void> | void;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
