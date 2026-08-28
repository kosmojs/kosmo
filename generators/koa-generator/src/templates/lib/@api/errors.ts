import type {
  DefaultContext,
  DefaultState,
  ParameterizedContext,
} from "../api";

type ErrorHandler = (
  ctx: ParameterizedContext<unknown, DefaultState, DefaultContext>,
  next: Function,
) => Promise<void>;

export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;

export const errorHandlerFactory: ErrorHandlerFactory = (handler) => {
  return handler;
};
