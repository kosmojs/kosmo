```ts [core/api/use.ts]
import { use } from "@kosmojs/api";
import bodyparser from "@kosmojs/api/bodyparser";

export default [
  use(
    bodyparser.json(), // [!code hl]
    {
      slot: "bodyparser", // [!code hl]
      on: ["POST", "PUT", "PATCH"],
    },
  ),
];
```
