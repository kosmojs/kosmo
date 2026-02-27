---
title: Vue Generator - Custom Page Templates
description: Override default generated Vue page components using flexible pattern matching.
    Create custom scaffolding for landing pages, admin dashboards, and marketing sections.
head:
  - - meta
    - name: keywords
      content: vue custom templates, scaffold vue pages, route patterns,
        page templates, kosmojs vue scaffolding, index.vue template
---

The `Vue` generator allows you to override its default page template for specific
routes using pattern-based matching. When a new page is created and the path
matches one of your configured patterns, the generator writes your custom
template instead of the default.

This makes it easy to standardize layouts for landing pages, admin tools, or
any part of the app requiring a consistent structure from the start.

## ⚙️ Configuration

Pass custom templates into the generator via `vite.config.ts`:

```ts [vite.config.ts]
import vuePlugin from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import {
  // ...
  vueGenerator,
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

const landingTemplate = `
<template>
  <div class="landing-page">
    <h1>Welcome to Our Landing Page</h1>
    <p>This was scaffolded using a custom template!</p>
  </div>
</template>

<script setup lang="ts">
// Add script logic here if needed
</script>
`;

export default defineConfig(import.meta.dirname, {
  plugins: [
    vuePlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        vueGenerator({
          templates: { // [!code hl:4]
            "landing/*": landingTemplate,
            "marketing/**/*": landingTemplate,
          },
        }),
      ],
    }),
  ],
});
```

The keys in `templates` are simply **glob patterns**.

## 🎯 Pattern Matching

Glob-like patterns allow you to target specific route folders and depths.

### Single Level Match (`*`)

Matches only one folder level deep:

```ts
{ "landing/*": template }
```

**Matches:**

- `landing/home`
- `landing/:slug`

**Not matched:**

- `landing/features/new` (too deep)
- `landing` (too shallow)

### Multi-Level Match (`**`)

Matches nested structures at any depth:

```ts
{ "marketing/**/*": template }
```

**Matches:**

- `marketing/campaigns/summer`
- `marketing/promo/2025/special`

### Exact Match

Explicit match for a specific route:

```ts
{ "products/list": template }
```

Only affects `products/list`.

---

## 📊 Pattern Priority

If multiple patterns match, the **first one wins**:

```ts
vueGenerator({
  templates: {
    "landing/home": homeTemplate,   // most specific
    "landing/*": landingTemplate,   // fallback
    "**/*": fallbackTemplate,       // global catch-all
  },
});
```

For `landing/home`, the `homeTemplate` will always be applied.

## 🔀 Dynamic Routes

Dynamic segments work exactly the same - no difference in matching behavior:

```ts
{
  "users/:id": userTemplate,
  "products/{:category}": productTemplate,
  "docs/{...path}": docsTemplate,
  "shop/:category/{:sub}": shopTemplate,
}
```

Templates are scaffolded with the correct folder structure, and you may access
route params later using `useRoute()` inside `<script setup>`.

## 📝 Template Structure

Templates are **static strings** that become `.vue` files when generated:

```vue [customTemplate.vue]
<template>
  <section class="page">
    <h1>Custom Page</h1>
  </section>
</template>

<script setup lang="ts">
// This comment is replaced into new pages during scaffolding
</script>
```

Templates are **plain string files** processed using Handlebars syntax.
Any dynamic content you want inserted into the generated `.vue`
file must use Handlebars placeholders. After scaffolding, the result becomes a
real `Vue` SFC - there is no runtime template processing.

> While templates can be stored in `.hbs` files for organization and editor
> support, they must use valid Handlebars syntax to ensure `KosmoJS` can apply
> replacements during generation.

⚠️ Avoid using raw `Vue` interpolation (<code>&#123;&#123; &#125;&#125;</code>) inside Vue expressions - wrap
them in quotes or escape them to prevent accidental Handlebars evaluation.

## ✨ Use Cases

### Landing Pages

```ts
vueGenerator({
  templates: {
    "landing/**/*": landingTemplate,
  },
});
```

Perfect for hero sections and marketing-heavy layouts.

### Marketing Content

Different templates for promo paths or campaign microsites:

```ts
vueGenerator({
  templates: {
    "marketing/**/*": marketingTemplate,
    "promo/**/*": promoTemplate,
  },
});
```

### Admin Tools

Give admin pages consistent structure:

```ts
vueGenerator({
  templates: {
    "admin/**/*": adminTemplate,
  },
});
```

---

## 📄 Default Template Override

Routes that do not match any pattern use the `Vue` generator's built-in default.
You can replace it globally using:

```ts
vueGenerator({
  templates: {
    "**/*": myDefaultTemplate,
  },
});
```

---

## 💡 Best Practices

**Focus templates where they matter**
Use them for structural variety, not tiny changes.

**Use shared layouts**
Import reusable containers or UI primitives within templates.

**Keep complexity manageable**
Since templates are strings, large ones are easier to maintain in `.hbs`
files.

**Validate output**
Generated files bypass default scaffolding - test navigation + data loading.

---

## 📌 Reference Templates (Official)

`KosmoJS` provides helpful [example templates](https://github.com/kosmojs/kosmo/tree/main/packages/generators/vue-generator/src/templates/public) you can adapt.

These demonstrate common patterns such as styled page shells and placeholder
content.

---

Custom templates let you embed branding, layouts, and editorial style early -
so every new page begins with a strong foundation tailored to your application.
