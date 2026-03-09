```ts [api/use.ts]
import { use } from "_/admin/api";

export default [
  use(
    (ctx, next) => {
      // authentication logic here // [!code hl]
      return next();
    },
    {
      slot: "auth", // [!code hl]
      on: ["POST", "PUT", "PATCH", "DELETE"],
    },
  ),
];
```
