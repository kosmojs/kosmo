import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";

import { ValidationError, HTTPError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "{{ createImport 'lib' 'api:factory' }}";

export default errorHandlerFactory(
  async function defaultErrorHandler(error, ctx) {
    // Let Hono's HTTPException handle its own response
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const [message, status] =
      error instanceof ValidationError
        ? [`${error.target}: ${error.errorMessage}`, 400]
        : error instanceof HTTPError
          ? [error.message, error.status]
          : [error.message, error.statusCode || 500];

    // Respond based on what the client accepts
    const type = accepts(ctx, {
      header: "Accept",
      supports: ["application/json", "text/plain"],
      default: "text/plain",
    });

    return type === "application/json"
      ? ctx.json({ error: message }, status)
      : ctx.text(message, status);
  },
);
