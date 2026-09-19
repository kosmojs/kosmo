<!-- #region hono -->
```ts
// Hono: api/users/[id]/index.ts
import { HTTPError } from "@kosmojs/core/errors";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const user = await db.users.find(id);

    // throw - api/errors.ts turns it into a response
    if (!user) throw new HTTPError([404, "User not found"]);

    return ctx.json(user);
  }),
]);
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts
// H3: api/users/[id]/index.ts
import { HTTPError } from "@kosmojs/core/errors";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET(async (event) => {
    const { id } = event.validated.params;
    const user = await db.users.find(id);

    // throw - api/errors.ts turns it into a response
    if (!user) throw new HTTPError([404, "User not found"]);

    return user;
  }),
]);
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts
// Koa: api/users/[id]/index.ts
import { HTTPError } from "@kosmojs/core/errors";

export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params;
    const user = await db.users.find(id);

    // throw - api/errors.ts turns it into a response
    if (!user) throw new HTTPError([404, "User not found"]);

    ctx.body = user;
  }),
]);
```
<!-- #endregion koa -->
