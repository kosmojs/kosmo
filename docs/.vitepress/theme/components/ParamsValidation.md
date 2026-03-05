```ts [api/users/[id]/{activity}/index.ts]
import { defineRoute } from "_/front/api/users/[id]/{activity}";

export default defineRoute<[
  // validate id as number // [!code hl]
  number,
  // activity, if given, should be one of // [!code hl]
  TRefine<string, "posts" | "comments" | "likes">,
]>(({ GET }) => [
  GET((ctx) => {
    // ctx.validated.params is typed and validated at runtime // [!code hl]
    const { id, activity } = ctx.validated.params
  })
]);
```
