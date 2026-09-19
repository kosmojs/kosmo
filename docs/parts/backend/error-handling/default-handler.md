<!-- #region hono -->
```ts
// Hono: api/errors.ts
import { accepts } from "hono/accepts";
import { HTTPException } from "hono/http-exception";

import { ValidationError, HTTPError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (error, ctx) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  const [status, message] = Array.isArray(error)
    ? error
    : error instanceof HTTPError
      ? [error.status, error.message]
      : error instanceof ValidationError
        ? [400, `${error.target}: ${error.errorMessage}`]
        : [error.statusCode || 500, error.message];

  const type = accepts(ctx, {
    header: "Accept",
    supports: ["application/json", "text/plain"],
    default: "text/plain",
  });

  return type === "application/json"
    ? ctx.json({ error: message }, status)
    : ctx.text(message, status);
});
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts
// H3: api/errors.ts
import { ValidationError } from "@kosmojs/core/errors";
import { HTTPError } from "h3";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (error, event) => {
  const [status, message = "Unknown error occurred"] = Array.isArray(error)
    ? error
    : error instanceof HTTPError
      ? [error.status, error.message]
      : error instanceof ValidationError
        ? [400, `${error.target}: ${error.errorMessage}`]
        : [error.statusCode || 500, error.message];

  const accept = event.req.headers.get("accept");

  return accept?.includes("application/json")
    ? new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    : new Response(message, {
        status,
        headers: { "Content-Type": "text/plain" },
      });
});
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts
// Koa: api/errors.ts
import { HTTPError, ValidationError } from "@kosmojs/core/errors";

import { errorHandlerFactory } from "_/api:factory";

export default errorHandlerFactory(async (ctx, next) => {
  try {
    await next();
  } catch (error: any) {
    const [status, message] = Array.isArray(error)
      ? error
      : error instanceof HTTPError
        ? [error.status, error.message]
        : error instanceof ValidationError
          ? [400, `${error.target}: ${error.errorMessage}`]
          : [error.statusCode || 500, error.message];

    ctx.status = status;

    if (ctx.accepts("json")) {
      ctx.body = { error: message };
    } else {
      ctx.body = message;
    }
  }
});
```
<!-- #endregion koa -->
