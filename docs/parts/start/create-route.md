
<!-- #region hono -->
// Hono: api/users/[id]/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();
    return ctx.json({ id, name: "Jane Smith", email: "jane@example.com" });
  }),
]);
<!-- #endregion hono -->

<!-- #region h3 -->
// H3: api/users/[id]/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (event) => {
    const { id } = event.context.params;
    return { id, name: "Jane Smith", email: "jane@example.com" };
  }),
]);
<!-- #endregion h3 -->

<!-- #region koa -->
// Koa: api/users/[id]/index.ts
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;
    ctx.body = { id, name: "Jane Smith", email: "jane@example.com" };
  }),
]);
<!-- #endregion koa -->
