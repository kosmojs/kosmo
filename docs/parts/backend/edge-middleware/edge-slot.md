<!-- #region hono -->
```ts [api/use.ts]
// Hono: api/use.ts
import { HTTPError } from "@kosmojs/core/errors";

import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new HTTPError([401, "Authentication required"]);
    }
    return next();
  }, {
    slot: "edge:auth",
  }),
];
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts [api/use.ts]
// H3: api/use.ts
import { HTTPError } from "@kosmojs/core/errors";

import { use } from "_/api";

export default [
  use(async (event, next) => {
    const token = event.req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new HTTPError([401, "Authentication required"]);
    }
    return next();
  }, {
    slot: "edge:auth",
  }),
];
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts [api/use.ts]
// Koa: api/use.ts
import { HTTPError } from "@kosmojs/core/errors";

import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      throw new HTTPError([401, "Authentication required"]);
    }
    return next();
  }, {
    slot: "edge:auth",
  }),
];
```
<!-- #endregion koa -->
