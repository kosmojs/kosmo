<!-- #region hono -->
// Hono: api/users/use.ts
import { rateLimiter } from "hono-rate-limiter";

import { use } from "_/api";

export default [
  use(
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      keyGenerator: (ctx) => ctx.req.header("x-forwarded-for") ?? "anonymous",
    }),
  ),
];
<!-- #endregion hono -->

<!-- #region h3 -->
// H3: api/users/use.ts
import { use } from "_/api";

export default [
  use(async function noStore(event, next) {
    event.res.headers.set("cache-control", "no-store");
    return next();
  }),
];
<!-- #endregion h3 -->

<!-- #region koa -->
// Koa: api/users/use.ts
import ratelimit from "koa-ratelimit";

import { use } from "_/api";

const db = new Map();

export default [
  use(ratelimit({ driver: "memory", db, duration: 15 * 60 * 1000, max: 100 })),
];
<!-- #endregion koa -->
