import { bodyParser } from "@koa/bodyparser";

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
          const { scope, errorMessage } = error;
          ctx.status = 400;
          ctx.body = { error: `ValidationError: ${scope} - ${errorMessage}` };
        } else {
          ctx.status = error.statusCode || error.status || 500;
          ctx.body = { error: error.message };
        }
      }
    },
    { slot: "errorHandler" },
  ),

  use(bodyParser(), {
    on: ["POST", "PUT", "PATCH"],
    slot: "bodyparser",
  }),

  use(
    function usePayload(ctx, next) {
      ctx.payload = ["POST", "PUT", "PATCH"].includes(ctx.method)
        ? ctx.request.body
        : ctx.query;
      return next();
    },
    { slot: "payload" },
  ),
];
