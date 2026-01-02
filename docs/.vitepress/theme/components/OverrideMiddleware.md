```ts [api/files/upload/index.ts]
import bodyparser from "@kosmojs/api/bodyparser";
import { defineRoute } from "_/admin/api/files/upload";

export default defineRoute(({ use, POST }) => [
  use(
    bodyparser.form(), // use form bodyparser [!code hl]
    {
      slot: "bodyparser", // [!code hl]
      on: ["POST"],
    },
  ),

  POST((ctx) => {
    // ctx.payload now contains parsed form data // [!code hl]
  })
]);
```
