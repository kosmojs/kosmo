---
title: Custom Page Templates
description: Override default generated page components for specific routes using
  glob pattern matching. Create specialized scaffolding for landing pages, admin
  dashboards, and marketing sections in React, SolidJS, and Vue applications.
head:
  - - meta
    - name: keywords
      content: react templates, solidjs templates, vue custom templates, custom page
        templates, route patterns, glob matching, template configuration, landing page
        templates, route customization, kosmojs scaffolding
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

Pass custom templates via generator options in your source folder's
`vite.config.ts`:

::: code-group

```ts [React]
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import { reactGenerator } from "@kosmojs/generators";

import defineConfig from "../vite.base";

// [!code ++:9]
const landingTemplate = `
export default function Page() {
  return (
    <div class="landing-page">
      <h1>Welcome</h1>
    </div>
  );
}`;

export default defineConfig(import.meta.dirname, {
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        reactGenerator({ // [!code ++:4]
          templates: {
            "landing/*": landingTemplate,
            "marketing/**/*": landingTemplate,
          },
        }),
      ],
    }),
  ],
});
```

```ts [SolidJS]
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import { solidGenerator } from "@kosmojs/generators";

import defineConfig from "../vite.base";

// [!code ++:9]
const landingTemplate = `
export default function Page() {
  return (
    <div class="landing-page">
      <h1>Welcome</h1>
    </div>
  );
}`;

export default defineConfig(import.meta.dirname, {
  plugins: [
    solidPlugin(),
    devPlugin(apiurl, {
      generators: [
        solidGenerator({ // [!code ++:4]
          templates: {
            "landing/*": landingTemplate,
            "marketing/**/*": landingTemplate,
          },
        }),
      ],
    }),
  ],
});
```

```ts [Vue]
import vuePlugin from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import { vueGenerator } from "@kosmojs/generators";

import defineConfig from "../vite.base";

// [!code ++:11]
const landingTemplate = `
<template>
  <div class="landing-page">
    <h1>Welcome</h1>
  </div>
</template>

<script setup lang="ts">
// Add script logic here
</script>`;

export default defineConfig(import.meta.dirname, {
  plugins: [
    vuePlugin(),
    devPlugin(apiurl, {
      generators: [
        vueGenerator({ // [!code ++:4]
          templates: {
            "landing/*": landingTemplate,
            "marketing/**/*": landingTemplate,
          },
        }),
      ],
    }),
  ],
});
```

:::

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
