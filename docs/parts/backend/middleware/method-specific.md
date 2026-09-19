<!-- #region hono -->
// Hono: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    ctx.set("user", await verifyToken(ctx.req.header("authorization")));
    return next();
  }, {
    on: ["POST"],
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.get("user") is available
  }),
]);
<!-- #endregion hono -->

<!-- #region h3 -->
// H3: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (event, next) => {
    event.context.user = await verifyToken(event.req.headers.get("authorization"));
    return next();
  }, {
    on: ["POST"],
  }),

  GET(async (event) => {
    // no auth required
  }),

  POST(async (event) => {
    // event.context.user is available
  }),
]);
<!-- #endregion h3 -->

<!-- #region koa -->
// Koa: api/example/index.ts
export default defineRoute<"example">(({ GET, POST, use }) => [
  use(async (ctx, next) => {
    ctx.state.user = await verifyToken(ctx.headers.authorization);
    return next();
  }, {
    on: ["POST"],
  }),

  GET(async (ctx) => {
    // no auth required
  }),

  POST(async (ctx) => {
    // ctx.state.user is available
  }),
]);
<!-- #endregion koa -->
