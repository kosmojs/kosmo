```ts [api/dashboard/index.ts]
import { defineRoute } from "_/admin/api/dashboard";

export default defineRoute(({ use, POST }) => [
  use(
    (ctx, next) => { // [!code hl:4]
      // no authentication for dashboard
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
