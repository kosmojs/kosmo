---
title: Custom Page Templates
description: Override default seeded page components for specific routes using glob pattern matching.
    Seed specialized boilerplate for landing pages, admin dashboards, marketing sections etc.
head:
  - - meta
    - name: keywords
      content: react templates, solidjs templates, vue templates, svelte templates, mdx templates,
        route patterns, glob matching, template configuration, landing page templates
---

Every frontend framework supports template overrides for specific routes through <span style="white-space: nowrap">pattern-based</span> matching.
Useful for standardizing structure across landing pages, admin tools, or any section requiring a consistent starting point.

Templates seed page `index` files - `pages/**/index.*` - and nothing else.
Every other seeded file gets the built-in minimal boilerplate to start from.

## Configuration

Pass custom templates through the `frontend` block in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

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
  frontend: {
    stack: "react",
    base: "/front",
    templates: { // [!code ++:4]
      "landing/*": landingTemplate,
      "marketing/**": landingTemplate,
    },
  },
});
```

Now every new route under `landing/` and `marketing/` will start with your template.

> **Templates only fill blank files.**
Boilerplate is written into a file **only when that file is empty**.
It never overwrites work you have already done - which is also why changing a template does not retroactively rewrite existing pages.
To re-seed one, empty the file and it will be filled again.

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
templates: {
  "landing/home": homeTemplate,   // highest specificity
  "landing/*": landingTemplate,   // medium specificity
  "**": fallbackTemplate,         // lowest specificity
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
// React: kosmo.config.ts
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
// Solid: kosmo.config.ts
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
// Vue: kosmo.config.ts
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
// Svelte: kosmo.config.ts
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
// MDX: kosmo.config.ts
import { useParams } from "_/use";

# Custom Template

Route params: {JSON.stringify(useParams())}
```
:::

> Templates use Handlebars syntax for any dynamic content injected during seeding.
Avoid raw Vue interpolation <code>{{"{{"}}</code><code>}}</code> inside template strings -
wrap in quotes or escape as needed to prevent accidental Handlebars evaluation.

## Common Use Cases

### Landing & Marketing Pages

```ts
frontend: {
  stack: "react",
  base: "/front",
  templates: {
    "landing/**": landingTemplate,
    "marketing/**": marketingTemplate,
    "promo/**": promoTemplate,
  },
}
```

### Admin Interfaces

```ts
frontend: {
  stack: "react",
  base: "/front",
  templates: {
    "admin/**": adminTemplate,
  },
}
```

## Default Template Override

Routes without a matching pattern use the built-in default, which
displays the route name as a placeholder. Replace it globally with:

```ts
templates: {
  "**": myDefaultTemplate,
}
```
