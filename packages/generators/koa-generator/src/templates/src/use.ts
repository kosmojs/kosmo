import { ValidationError } from "@kosmojs/api";

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
        if (error instanceof ValidationError) {
          const { target, errorMessage } = error;
          ctx.status = 400;
          ctx.body = { error: `ValidationError: ${target} - ${errorMessage}` };
        } else {
          ctx.status = error.statusCode || error.status || 500;
          ctx.body = { error: error.message };
        }
      }
    },
    { slot: "errorHandler" },
  ),
];
