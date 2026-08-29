---
title: Custom Page Templates
description: Override default generated page components for specific routes using
  glob pattern matching. Create specialized scaffolding for landing pages, admin
  dashboards, and marketing sections in React, SolidJS, Vue, Svelte and MDX source folders.
head:
  - - meta
    - name: keywords
      content: react templates, solidjs templates, vue templates, svelte templates, mdx templates,
        route patterns, glob matching, template configuration, landing page templates
---

Each framework generator supports template overrides for specific routes through
pattern-based matching. When a new page is created and its path matches a
configured pattern, the generator writes your custom template instead of the
default - useful for standardizing structure across landing pages, admin tools,
or any section requiring a consistent starting point.

This is the frontend half of the feature; API routes have their own.
[Custom Route Templates ›](/backend/custom-templates)

## What It Overrides

Only page components - and not quite all of them:

| File | Templatable? |
|---|:---:|
| `pages/**/index.*` - page components | ✅ |
| `pages/index/index.*` - the root route | ❌ always the built-in welcome page |
| `pages/**/layout.*` - layouts | ❌ always the built-in layout |
| `pages/404.*` | ❌ deployed once at folder creation |

::: warning Templates only fill blank files
The generator writes boilerplate into a file **only when that file is empty**.
It never overwrites work you have already done - which is also why changing a template does not retroactively rewrite existing pages.
To re-scaffold one, empty the file and let it be regenerated.
:::

## Configuration

Pass custom templates via generator options in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import { defineConfig, reactGenerator } from "@kosmojs/dev";

// [!code ++:8]
const landingTemplate = `
export default function Page() {
  return (
    <div class="landing-page">
      <h1>Welcome</h1>
    </div>
  );
}`;

export default defineConfig({
  generators: [
    reactGenerator({
      templates: { // [!code ++:4]
        "landing/*": landingTemplate,
        "marketing/**": landingTemplate,
      },
    }),
  ],
});
```

## Pattern Syntax

Templates use glob-style patterns to match routes:

### Single-Depth Wildcard (`*`)

Matches routes at exactly one nesting level:

```ts
{ "landing/*": template }
```

**Matches:** `landing/home`, `landing/about`, `landing/[slug]`

**Excludes:** `landing/features/new` (too deep), `landing` (too shallow)

### Multi-Depth Wildcard (`**`)

Matches routes at any nesting depth:

```ts
{ "marketing/**": template }
```

**Matches:** `marketing/campaigns/summer`, `marketing/promo/2024/special`, `marketing/[id]/details`

### Exact Match

Targets a single specific route:

```ts
{ "products/list": template }
```

## Resolution Priority

When multiple patterns match, the first matching pattern wins - in the order the keys are
written, so order them most specific first:

```ts
generator({
  templates: {
    "landing/home": homeTemplate,   // highest specificity
    "landing/*": landingTemplate,   // medium specificity
    "**": fallbackTemplate,         // lowest specificity
  },
})
```

::: warning Numeric-looking patterns jump the queue
JavaScript objects order integer-like keys first, regardless of where you wrote them - so
a pattern such as `"2024/**"` is hoisted to the front and matches before anything above
it. Prefix it with `./` to keep your written order: `"./2024/**"`.
The `./` is stripped before matching.

The same applies to [`renderMode`](/frontend/server-side-render#selecting-the-render-mode), which uses the same resolver.
:::

## Parameter Compatibility

Route parameters are escaped before matching, so `[id]`, `{id}` and `{...path}` mean
themselves rather than glob syntax:

```ts
{
  "users/[id]": userTemplate,           // required parameter
  "products/{category}": productTemplate, // optional parameter
  "docs/{...path}": docsTemplate,        // splat parameter
  "shop/[category]/{sub}": shopTemplate, // combined
}
```

## Template Format

Templates are written to disk as the page component file.
A template can be either a **plain string**, or a **function** receiving the resolved route and returning the string -
useful when the output depends on the route itself:

```ts
templates: {
  // a plain string
  "landing/*": landingTemplate,

  // or a function of the route
  "admin/**": (route) => `
export default function Page() {
  return <h1>${route.name}</h1>;
}`,
}
```

Each framework has its own component structure:

:::tabs key:frontend variant:code
== React
```ts
const customTemplate = `
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
`;
```

== Solid
```ts
const customTemplate = `
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
`;
```

== Vue
```ts
const customTemplate = `
<template>
  <div>
    <h1>Custom Template</h1>
    <p>Route params: {{ JSON.stringify(route.params) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>
`;
```

== Svelte
```ts
const customTemplate = `
<script lang="ts">
import { useParams } from "_/use";
const params = useParams();
</script>

<div>
  <h1>Custom Template</h1>
  <p>Route params: {JSON.stringify(params)}</p>
</div>
`;
```

== MDX
```mdx
import { useParams } from "_/use";

# Custom Template

Route params: {JSON.stringify(useParams())}
```
:::

> Templates use Handlebars syntax for any dynamic content injected during generation.
Avoid raw Vue interpolation <code>{{"{{"}}</code><code>}}</code> inside template strings -
wrap in quotes or escape as needed to prevent accidental Handlebars evaluation.

## Common Use Cases

### Landing & Marketing Pages

```ts
generator({
  templates: {
    "landing/**": landingTemplate,
    "marketing/**": marketingTemplate,
    "promo/**": promoTemplate,
  },
})
```

### Admin Interfaces

```ts
generator({
  templates: {
    "admin/**": adminTemplate,
  },
})
```

## Default Template Override

Routes without a matching pattern use the generator's built-in default, which
displays the route name as a placeholder. Replace it globally with:

```ts
generator({
  templates: {
    "**": myDefaultTemplate,
  },
})
```

Note this still does not reach the root `index` route or `layout` files -
see [What It Overrides](#what-it-overrides).
