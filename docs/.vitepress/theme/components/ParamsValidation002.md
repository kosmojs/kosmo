```ts [api/users/:id/index.ts]
import { defineRoute } from "_/admin/api/users/:id";

export default defineRoute<[
  // validate id as positive integer // [!code focus:2]
  TRefine<number, { minimum: 1, multipleOf: 1 }>
]>(({ GET }) => [
  GET((ctx) => {
    // ctx.validated.params is typed and validated at runtime // [!code hl]
    const { id } = ctx.typedParams
  })
]);
```
