
<!-- #region hono -->
// Hono: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";
import { cors } from "hono/cors"; // [!code ++]

export default appFactory(routes, ({ app }) => {
  app.onError(defaultErrorHandler);
  app.use(cors({ origin: "https://example.com" })); // [!code ++]
});
<!-- #endregion hono -->

<!-- #region h3 -->
// H3: api/app.ts
import { onError } from "h3";

import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";
import { cors } from "./cors"; // [!code ++]

export default appFactory(routes, ({ app }) => {
  app.use(onError(defaultErrorHandler));
  app.use(cors({ origin: "https://example.com" })); // [!code ++]
});
<!-- #endregion h3 -->

<!-- #region koa -->
// Koa: api/app.ts
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";
import cors from "@koa/cors"; // [!code ++]

export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);
  app.use(cors({ credentials: true })); // [!code ++]
});
<!-- #endregion koa -->
