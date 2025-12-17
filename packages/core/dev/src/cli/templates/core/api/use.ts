import { use } from "@kosmojs/api";
import bodyparser from "@kosmojs/api/bodyparser";

import { errorHandler } from "./errors";

// Middleware applied to all routes by default.
// Can be overridden on a per-route basis using the slot key.
export default [
  use(errorHandler, { slot: "errorHandler" }),

  use(bodyparser.json(), {
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
