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

When you create a new route file, `KosmoJS` detects it and instantly generates appropriate boilerplate code.

This generation is context-aware - it produces different code
depending on whether you're creating an API route or a client page,
and adapts to your chosen framework.

This automatic generation serves two purposes.

First, it saves you from the tedium of repeatedly typing the same structural code.

Second, and more importantly, it ensures that every route follows the correct patterns
and imports the right types from the beginning.

You get a working starting point that's already integrated with `KosmoJS`'s type system.

> Some editors loads generated content immediately,
> others may require you to briefly unfocus and refocus the editor to load the new content.

## ⚙️ API Route Generation

When you create a file like `api/users/:id/index.ts`,
`KosmoJS` generates this content based on your chosen API framework:

::: code-group

```ts [Koa]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/:id ]";
  }),
]);
```
```ts [Hono]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.text("Automatically generated route: [ users/:id ]");
  }),
]);
```
:::

Let's break down what's happening here.

The import statement brings in a `defineRoute` helper function from a generated module.
Notice the import path uses the `_/` prefix - this accesses generated code from the `lib/src/` directory.

Breaking down `_/front/api/users/:id`:

* `_/` - Generated code prefix (maps to `lib/src/`)
* `front` - Your source folder name (from `src/front/`)
* `api/users/:id` - Mirrors your route file's location

So this import resolves to `lib/src/front/api/users/:id/index.ts` -
a file `KosmoJS` generated automatically that mirrors your route structure.

This generated module includes `TypeScript` type information about your route's parameters.
In this case, it knows that this route has an `id` parameter,
and that information flows through to your handler,
enabling type-safe access via `ctx.validated.params.id`.

The `defineRoute` function accepts a callback that receives HTTP method helpers.
In this example, you see `GET`, but you also have access to `POST`, `PUT`, `DELETE`, `PATCH`, and other HTTP methods.

You can define handlers for multiple methods in the same route by adding more method calls to the array.

## 🎨 Client Page Generation

For client-side pages, the generated code adapts to your chosen framework.
If you create `pages/users/:id/index.tsx` while using the `SolidJS` generator, `KosmoJS` generates:

```ts [pages/users/:id/index.tsx]
export default function Page() {
  return <div>Automatically generated Solid Page: [ users/:id ]</div>;
}
```

This is a minimal functional component that you can immediately see in your browser
when you navigate to the corresponding URL.

The component is named `Page` by default but you can rename it to better reflect the component purpose.

Generated component returns JSX that renders a placeholder message indicating which route this is.

If you were using the `React` generator, the generated code would be nearly identical
but would follow `React`-specific patterns and conventions.

The generator understands your framework and produces appropriate code.

The generated scaffold gives you the component structure,
and you add your framework-specific logic for routing, data fetching, and rendering.

Because the route parameters are part of the URL structure that `KosmoJS` manages,
your framework's router integration can access them naturally.
