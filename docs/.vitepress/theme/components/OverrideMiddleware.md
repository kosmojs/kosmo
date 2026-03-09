```ts [api/dashboard/index.ts]
import { defineRoute } from "_/admin/api";

export default defineRoute<"dashboard">(({ use, POST }) => [
  use(
    (ctx, next) => {
      // no authentication for dashboard // [!code hl]
      return next();
    },
    {
      slot: "auth", // [!code hl]
    },
  ),

  POST((ctx) => {
    // ...
  })
]);
```
