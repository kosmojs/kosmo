---
title: Auto-Generated Route Content
description: KosmoJS automatically generates boilerplate code for new routes with context-aware templates
    for API endpoints using defineRoute and framework-specific page components.
head:
  - - meta
    - name: keywords
      content: code generation, route templates, defineRoute, auto-generated routes,
        boilerplate code, koa context, page components
---

When you create a new route file, `KosmoJS` detects it and generates appropriate boilerplate immediately.
The output differs based on whether the file is an API route or a client page, and which framework you're using.

> Some editors load generated content instantly, others may require you to briefly unfocus
> and refocus the file to see the new content.

## ⚙️ API Routes

Creating `api/users/[id]/index.ts` generates:

::: code-group
```ts [Koa]
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/[id] ]";
  }),
]);
```
```ts [Hono]
import { defineRoute } from "_/api";

export default defineRoute<"users/[id]">(({ GET }) => [
  GET(async (ctx) => {
    ctx.text("Automatically generated route: [ users/[id] ]");
  }),
]);
```
:::

The `_/` import prefix maps to `lib/` - generated code that provides full type definitions
for all your routes. `_/api` resolves to `lib/front/api.ts`, where `front` is your source folder name.

## 🎨 Client Pages

Creating `pages/users/[id]/index.tsx` generates a minimal framework component:

```tsx [pages/users/[id]/index.tsx]
export default function Page() {
  return <div>Automatically generated Page: [ users/[id] ]</div>;
}
```

The placeholder text includes your framework name and route path.
The component is named `Page` by default - rename it to something meaningful as you build it out.

> Avoid anonymous arrow functions for default exports - they can break Vite's HMR.
