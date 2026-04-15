import { HTTPError, ValidationError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "{{ createImport 'lib' 'api:factory' }}";

export default errorHandlerFactory(
  async function defaultErrorHandler(ctx, next) {
    try {
      await next();
    } catch (error: any) {
      const [errorMessage, status] =
        error instanceof ValidationError
          ? [`${error.target}: ${error.errorMessage}`, 400]
          : error instanceof HTTPError
            ? [error.message, error.status]
            : [error.message, error.statusCode || 500];
      if (ctx.accepts("json")) {
        ctx.status = 400;
        ctx.body = { error: errorMessage };
      } else {
        ctx.status = status;
        ctx.body = errorMessage;
      }
    }
  },
);
