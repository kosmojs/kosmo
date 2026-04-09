---
title: Custom Page Templates
description: Override default generated page components for specific routes using
  glob pattern matching. Create specialized scaffolding for landing pages, admin
  dashboards, and marketing sections in React, SolidJS, Vue and MDX source folders.
head:
  - - meta
    - name: keywords
      content: react templates, solidjs templates, vue templates, mdx templates,
        route patterns, glob matching, template configuration, landing page templates
---

Each framework generator supports template overrides for specific routes through
pattern-based matching. When a new page is created and its path matches a
configured pattern, the generator writes your custom template instead of the
default - useful for standardizing structure across landing pages, admin tools,
or any section requiring a consistent starting point.

Templates are particularly powerful for batch route generation. A common
scenario is scaffolding CRUD API routes for multiple database tables: create
one template capturing the standard boilerplate, define your routes, and each
generated file starts with the right structure ready to adapt - instead of
writing the same skeleton N times by hand.

## ⚙️ Configuration

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
        "marketing/**/*": landingTemplate,
      },
    }),
  ],
});
```

## 🎯 Pattern Syntax

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
{ "marketing/**/*": template }
```

**Matches:** `marketing/campaigns/summer`, `marketing/promo/2024/special`, `marketing/[id]/details`

### Exact Match

Targets a single specific route:

```ts
{ "products/list": template }
```

## 📊 Resolution Priority

When multiple patterns match, the first matching pattern wins:

```ts
generator({
  templates: {
    "landing/home": homeTemplate,   // highest specificity
    "landing/*": landingTemplate,   // medium specificity
    "**/*": fallbackTemplate,       // lowest specificity
  },
})
```

## 🔀 Parameter Compatibility

Templates work with all parameter types:

```ts
{
  "users/[id]": userTemplate,           // required parameter
  "products/{category}": productTemplate, // optional parameter
  "docs/{...path}": docsTemplate,        // splat parameter
  "shop/[category]/{sub}": shopTemplate, // combined
}
```

## 📝 Template Format

Templates are plain strings written to disk as component files. Each framework
has its own component structure:

::: code-group

```ts [React]
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

```ts [SolidJS]
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

```ts [Vue]
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

```mdx [MDX]
import { useParams } from "_/use";

# Custom Template

Route params: {JSON.stringify(useParams())}
```
:::

> **Vue templates** use Handlebars syntax for any dynamic content injected
> during generation. Avoid raw Vue interpolation <code>{{"{{"}}</code><code>}}</code> inside template
> strings - wrap in quotes or escape as needed to prevent accidental
> Handlebars evaluation.

## ✨ Common Use Cases

### Landing & Marketing Pages

```ts
generator({
  templates: {
    "landing/**/*": landingTemplate,
    "marketing/**/*": marketingTemplate,
    "promo/**/*": promoTemplate,
  },
})
```

### Admin Interfaces

```ts
generator({
  templates: {
    "admin/**/*": adminTemplate,
  },
})
```

## 📄 Default Template Override

Routes without a matching pattern use the generator's built-in default, which
displays the route name as a placeholder. Replace it globally with:

```ts
generator({
  templates: {
    "**/*": myDefaultTemplate,
  },
})
```
