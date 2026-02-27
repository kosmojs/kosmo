```ts [api/pages/:id/index.ts]
import { defineRoute } from "_/admin/api/pages/:id";

type Page = {
  id: TRefine<string, { format: "uuid" }>;
  title: TRefine<string, { minLength: 1; maxLength: 255 }>;
  content: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
}

export default defineRoute(({ GET }) => [
  GET<{
    response: [200, "json", Page], // [!code hl]
  }>(async (ctx) => {
    // response should match defined schema
  })
]);
```
