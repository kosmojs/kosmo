---
title: Custom Templates
description: >-
    Override the seeded route, page and layout files for specific routes
    with a directory of template files, matched by glob pattern.
    Seed boilerplate for landing pages, admin dashboards, marketing sections etc.
head:
  - - meta
    - name: keywords
      content: react templates, solidjs templates, vue templates, svelte templates, mdx templates,
        route patterns, glob matching, template configuration, landing page templates
---

Every frontend framework supports template overrides for specific routes
through <span style="white-space: nowrap">pattern-based</span> matching.

Useful for standardizing structure across landing pages, admin tools,
or any section requiring a consistent starting point.

A template is a directory holding up to three files, one for each file a route seeds:

| Template | Seeds |
|---|---|
| `index.tpl` | the route's `index.ts` |
| `page.tpl` | its page file - `page.tsx`, `page.vue`, `page.svelte` or `page.mdx` |
| `layout.tpl` | its layout - `layout.tsx`, `layout.vue`, `layout.svelte` or `layout.mdx` |

Each file is optional: a file the directory does not hold gets the built-in boilerplate.
A directory with only a `layout.tpl`, say, seeds layouts,
and leaves routes and pages to the defaults.

## Configuration

Keep the template directories next to the source folder's `kosmo.config.ts`:

```txt
src/front/
  kosmo.config.ts
  templates/
    landing/
      page.tpl
      layout.tpl
    crud/
      page.tpl
```

Then point route patterns at them from the `frontend` block of that `kosmo.config.ts`.
Paths are relative to the `kosmo.config.ts` itself:

```ts [kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "react",
    base: "/front",
    templates: { // [!code ++:5]
      "landing/*": "templates/landing",
      "marketing/**": "templates/landing",
      "crud/**": "templates/crud",
    },
  },
});
```

Now every new route under `landing/` and `marketing/` starts with your page and layout,
and every new route under `crud/` with your page.

Templates shared by several source folders can live outside `src/`:
`../../templates/crud` reaches `templates/crud` at the project root.

> **Templates only fill blank files.**
Boilerplate is written into a file **only when that file is empty**.
It never overwrites work you have already done - which is also why changing a template does not retroactively rewrite existing pages.
To re-seed one, empty the file and it will be filled again.

## Pattern Syntax

Templates use glob-style patterns to match routes:

### Single-Depth Wildcard (`*`)

Matches routes at exactly one nesting level:

```ts
{ "landing/*": "templates/landing" }
```

**Matches:** `landing/home`, `landing/about`, `landing/[slug]`

**Excludes:** `landing/features/new` (too deep), `landing` (too shallow)

### Multi-Depth Wildcard (`**`)

Matches routes at any nesting depth:

```ts
{ "marketing/**": "templates/landing" }
```

**Matches:** `marketing/campaigns/summer`, `marketing/promo/2024/special`, `marketing/[id]/details`

### Exact Match

Targets a single specific route:

```ts
{ "products/list": "templates/products" }
```

## Resolution Priority

When multiple patterns match, the first matching pattern wins - in the order the keys are
written, so order them most specific first:

```ts
templates: {
  // highest specificity
  "landing/home": "templates/home",
  // medium specificity
  "landing/*": "templates/landing",
  // lowest specificity
  "**": "templates/default",
}
```

::: warning Numeric-looking patterns jump the queue
JavaScript objects order integer-like keys first, regardless of where you wrote them - so
a pattern such as `"2024/**"` is hoisted to the front and matches before anything above
it. Prefix it with `./` to keep your written order: `"./2024/**"`.
The `./` is stripped before matching.

The same applies to [renderMode](/frontend/server-side-render#selecting-the-render-mode), which uses the same resolver.
:::

## Parameter Compatibility

Route parameters are escaped before matching, so `[id]`, `{id}` and `{...path}` mean
themselves rather than glob syntax:

```ts
{
  // required parameter
  "users/[id]": "templates/user",
  // optional parameter
  "products/{category}": "templates/product",
  // splat parameter
  "docs/{...path}": "templates/docs",
  // combined
  "shop/[category]/{sub}": "templates/shop",
}
```

## Template Files

A template file holds the seeded file as you want it.
It is rendered with Handlebars, with the route entry itself as the context,
so a <code v-pre>{{name}}</code> placeholder interpolates the route name.

The pattern is matched against the route a file belongs to:
`crud/settings/index.ts`, `crud/settings/page.tsx` and `crud/settings/layout.tsx`
are all matched as `crud/settings`.

### index.tpl

The route's `index.ts` is the same in every framework.
A template for it keeps the `defineRoute` call and its route name:

```ts [templates/crud/index.tpl]
import { defineRoute } from "_/pages";

export default defineRoute<"{{name}}">();
```

### page.tpl

The page file follows the folder's framework:

:::tabs key:frontend variant:code
== React
```tsx
// React: templates/crud/page.tpl
import { useParams } from "react-router";

export default function Page() {
  const params = useParams();

  return (
    <div>
      <h1>Custom Template</h1>
      <p>Route params: {JSON.stringify(params)}</p>
    </div>
  );
}
```

== Solid
```tsx
// Solid: templates/crud/page.tpl
import { useParams } from "@solidjs/router";

export default function Page() {
  const params = useParams();

  return (
    <div>
      <h1>Custom Template</h1>
      <p>Route params: {JSON.stringify(params)}</p>
    </div>
  );
}
```

== Vue
```vue
<!-- Vue: templates/crud/page.tpl -->
<template>
  <div>
    <h1>Custom Template</h1>
    <p>Route params: \{{ JSON.stringify(route.params) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>
```

== Svelte
```svelte
<!-- Svelte: templates/crud/page.tpl -->
<script lang="ts">
import { useParams } from "_/use";
const params = useParams();
</script>

<div>
  <h1>Custom Template</h1>
  <p>Route params: {JSON.stringify(params)}</p>
</div>
```

== MDX
```mdx
{/* MDX: templates/crud/page.tpl */}
import { useParams } from "_/use";

# Custom Template

Route params: {JSON.stringify(useParams())}
```
:::

A page's default export should be a named function, as above:
an anonymous arrow can break Vite's HMR.

> Handlebars takes every <code v-pre>{{ }}</code> for its own.
Escape the ones meant for the page - Vue's interpolation, say - as <code v-pre>\\{{ }}</code>,
and they are written to the page file as <code v-pre>{{ }}</code>.

### layout.tpl

A layout template seeds a `layout.*` file, created the usual way, in any folder the pattern matches.
It is matched as the route its folder would be, whether or not that folder has an `index.ts`.

## Common Use Cases

### Landing & Marketing Pages

```ts
frontend: {
  stack: "react",
  base: "/front",
  templates: {
    "landing/**": "templates/landing",
    "marketing/**": "templates/marketing",
    "promo/**": "templates/promo",
  },
}
```

### Admin Interfaces

```ts
frontend: {
  stack: "react",
  base: "/front",
  templates: {
    "crud/**": "templates/crud",
  },
}
```

## Default Template Override

Routes without a matching pattern use the built-in default, which
displays the route name as a placeholder. Replace it globally with:

```ts
templates: {
  "**": "templates/default",
}
```
