<!-- #region hono -->
```ts
// Hono: api/dev.ts
import { getRequestListener } from "@hono/node-server";

import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
});
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts
// H3: api/dev.ts
import { toNodeHandler } from "h3/node";

import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return toNodeHandler(app);
  },
});
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts
// Koa: api/dev.ts
import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
});
```
<!-- #endregion koa -->
