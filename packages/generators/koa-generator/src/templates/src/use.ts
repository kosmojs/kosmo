import { ValidationError } from "@kosmojs/api/errors";

import { use } from "{{ createImport 'libApi' }}";

/**
 * Define global middleware applied to all routes.
 * Can be overridden on a per-route basis using the slot key.
 * */
export default [
  use(
    async function useErrorHandler(ctx, next) {
      try {
        await next();
      } catch (error: any) {
        const [errorMessage, status] =
          error instanceof ValidationError
            ? [`${error.target}: ${error.errorMessage}`, 400]
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
    { slot: "errorHandler" },
  ),
];
