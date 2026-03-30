```ts [api/users/use.ts]
import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    // any route inside users/ folder and its subfolders
    // will wire this middleware automatically
    return next();
  })
];
```
