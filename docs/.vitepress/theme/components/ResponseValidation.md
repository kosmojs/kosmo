```ts [api/blog/[...page]/index.ts]
import { defineRoute } from "_/front/api/blog/[...page]";

type Page = {
  id: TRefine<string, { format: "uuid" }>;
  title: TRefine<string, { minLength: 1; maxLength: 255 }>;
  content: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
}

export default defineRoute(({ GET }) => [
  GET<
    never, // no payload validation // [!code hl:2]
    Page  // validate response to be a valid Page
  >(async (ctx) => {
    // ctx.body should match the schema defined above, // [!code hl:2]
    // otherwise validation fails and an error response is returned
  })
]);
```
