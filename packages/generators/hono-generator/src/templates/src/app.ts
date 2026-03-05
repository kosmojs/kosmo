import type { Context } from "hono";
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";

import { ValidationError } from "@kosmojs/api/errors";

import router from "{{ createImport 'api' 'router' }}";
import { appFactory } from "{{ createImport 'lib' 'api:app' }}";
import { routes } from "{{ createImport 'lib' 'api:router' }}";

export default appFactory(({ createApp }) => {
  const app = createApp({ router });

  app.onError((error: any, ctx: Context) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    const [message, status] =
      error instanceof ValidationError
        ? [`${error.target}: ${error.errorMessage}`, 400]
        : [error.message, error.statusCode || 500];

    const type = accepts(ctx, {
      header: "Accept",
      supports: ["application/json", "text/plain"],
      default: "text/plain",
    });

    return type === "application/json"
      ? ctx.json({ error: message }, status)
      : ctx.text(message, status);
  });

  for (const { path, methods, middleware } of routes) {
    app.on(methods, [path], ...middleware);
  }

  return app;
});
