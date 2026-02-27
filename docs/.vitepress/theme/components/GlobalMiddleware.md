```ts [api/use.ts]
import { use } from "_/admin/api";

export default [
  use(
    (ctx, next) => { // [!code hl:4]
      // authentication logic here
      return next();
    },
    {
      slot: "auth", // [!code hl]
      on: ["POST", "PUT", "PATCH", "DELETE"],
    },
  ),
];
```
