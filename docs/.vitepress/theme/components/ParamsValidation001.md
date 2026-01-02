```ts [api/users/[id]/index.ts]
import { defineRoute } from "_/admin/api/users/[id]";

export default defineRoute<[
  number // validate id as number // [!code hl]
]>(({ GET }) => [
  GET((ctx) => {
    // ctx.typedParams.id is typed and validated at runtime // [!code hl]
    const { id } = ctx.typedParams
  })
]);
```
