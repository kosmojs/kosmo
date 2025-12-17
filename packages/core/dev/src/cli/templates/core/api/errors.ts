import { createErrorHandler, ValidationError } from "@kosmojs/api";

export const errorHandler = createErrorHandler(
  async function useErrorHandler(ctx, next) {
    try {
      await next();
    } catch (error: any) {
      if (error instanceof ValidationError) {
        const { scope, errorMessage } = error;
        ctx.status = 400;
        ctx.body = { error: `ValidationError: ${scope} - ${errorMessage}` };
      } else {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = { error: error.message };
      }
    }
  },
);
