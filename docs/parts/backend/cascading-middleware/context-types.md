<!-- #region hono -->
```ts [api/users/use.ts]
// Hono: api/users/use.ts
import { HTTPException } from "hono/http-exception";

import { use } from "_/api";

export type UseT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<UseT>(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    // validate before adding to context - UseT promises this property exists
    if (!token) throw new HTTPException(401, { message: "Authentication required" });
    ctx.set("user", await verifyToken(token));
    return next();
  })
];
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts [api/users/use.ts]
// H3: api/users/use.ts
import { HTTPError } from "h3";

import { use } from "_/api";

export type UseT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<UseT>(async (event, next) => {
    const token = event.req.headers.get("authorization")?.replace("Bearer ", "");
    // validate before adding to context - UseT promises this property exists
    if (!token) throw new HTTPError({ status: 401, message: "Authentication required" });
    event.context.user = await verifyToken(token);
    return next();
  })
];
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts [api/users/use.ts]
// Koa: api/users/use.ts
import { use } from "_/api";

export type UseT = {
  user: { id: number; role: "admin" | "user" };
};

export default [
  use<UseT>(async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", "");
    // validate before adding to state - UseT promises this property exists
    ctx.assert(token, 401, "Authentication required");
    ctx.state.user = await verifyToken(token);
    return next();
  })
];
```
<!-- #endregion koa -->
