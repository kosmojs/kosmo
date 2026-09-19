<!-- #region hono -->
```ts [api/use.ts]
// Hono: api/use.ts
import { use } from "_/api";

export default [
  // will run on every route
  use(async function requestId(ctx, next) {
    ctx.set("requestId", crypto.randomUUID());
    return next();
  }),
];
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts [api/use.ts]
// H3: api/use.ts
import { use } from "_/api";

export default [
  // will run on every route
  use(async function requestId(event, next) {
    event.context.requestId = crypto.randomUUID();
    return next();
  }),
];
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts [api/use.ts]
// Koa: api/use.ts
import { use } from "_/api";

export default [
  // will run on every route
  use(async function requestId(ctx, next) {
    ctx.state.requestId = crypto.randomUUID();
    return next();
  }),
];
```
<!-- #endregion koa -->
