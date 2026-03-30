::: code-group
```ts [api/use.ts]
import { use } from "_/api";

export default [
  use(
    (ctx, next) => {
      // global logger // [!code hl]
      return next();
    },
    { slot: "logger", }, // [!code hl]
  ),
];
```

```ts [api/example/index.ts]
import { defineRoute } from "_/api";

export default defineRoute<"example">(({ use, GET }) => [
  use(
    async (ctx, next) => {
      // custom logger // [!code hl]
      return next();
    },
    { slot: "logger", }, // [!code hl]
  ),

  GET(async (ctx) => {
    // ...
  }),
]);
```

```ts [api/env.d.ts]
export declare module "@kosmojs/api" {
  interface UseSlots {
    logger: string; // [!code hl]
  }
}
```
:::
