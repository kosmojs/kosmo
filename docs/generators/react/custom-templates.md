---
title: React - Template Customization
description: Define custom page templates matching specific route patterns.
  Build specialized templates for promotional pages, landing experiences, and
  administrative interfaces with glob pattern matching.
head:
  - - meta
    - name: keywords
      content: react templates, custom page templates, route patterns, glob
        matching, template configuration, landing page templates, react
        component templates, route customization
---

`React` generator supports template overrides for specific routes
through pattern-based matching. This capability enables specialized templates
for promotional content, landing experiences, or routes requiring distinct
structural approaches.

## ⚙️ Template Configuration

Supply custom templates via generator options in `vite.config.ts`:

```ts [vite.config.ts]
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import reactGenerator from "@kosmojs/react-generator";
import defineConfig from "../vite.base";

const landingTemplate = `
export default function Page() {
  return (
    <div class="landing-page">
      <h1>Welcome to Our Landing Page</h1>
      <p>This uses a custom template!</p>
    </div>
  );
}
`;

export default defineConfig(import.meta.dirname, {
  // ...
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        reactGenerator({
          templates: {
            "landing/*": landingTemplate,
            "marketing/**/*": landingTemplate,
          },
        }),
        // other generators ...
      ],
    }),
  ],
});
```

## 🎯 Pattern Syntax

Route matching employs glob-style pattern syntax:

### Single-Depth Wildcard (`*`)

Captures routes at one specific nesting level:

```ts
{
  "landing/*": template,
}
```

**Captures:**
- `landing/home`
- `landing/about`
- `landing/[slug]`

**Excludes:**
- `landing/features/new` (excessive depth)
- `landing` (insufficient depth)

### Multi-Depth Wildcard (`**`)

Captures routes at arbitrary nesting depths:

```ts
{
  "marketing/**/*": template,
}
```

**Captures:**
- `marketing/campaigns/summer`
- `marketing/promo/2024/special`
- `marketing/[id]/details`

### Literal Match

Targets one specific route:

```ts
{
  "products/list": template,
}
```

**Captures:**
- `products/list` exclusively

## 📊 Resolution Priority

When patterns conflict, the first matching pattern wins:

```ts
reactGenerator({
  templates: {
    "landing/home": homeTemplate,      // Highest specificity
    "landing/*": landingTemplate,      // Medium specificity
    "**/*": fallbackTemplate,          // Lowest specificity
  },
})
```

For route `landing/home`:
- Applies `homeTemplate` (literal match supersedes wildcards)

## 🔀 Parameter Compatibility

Templates function with all parameter types:

```ts
{
  // Required parameter
  "users/[id]": userTemplate,

  // Optional parameter
  "products/[[category]]": productTemplate,

  // Rest parameter
  "docs/[...path]": docsTemplate,

  // Combined
  "shop/[category]/[[subcategory]]": shopTemplate,
}
```

Templates receive identical props as defaults, including route parameters.

## 📝 Template Format

Custom templates follow standard `React` component structure:

```ts
const customTemplate = `
import { useParams } from "@reactjs/router";

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

## ✨ Application Scenarios

### Promotional Pages

Build specialized promotional experiences:

```ts
const landingTemplate = `
import LandingLayout from "@/layouts/Landing";

export default function Page() {
  return (
    <LandingLayout>
      <div class="hero">
        <h1>Welcome</h1>
        <button>Get Started</button>
      </div>
    </LandingLayout>
  );
}
`;

reactGenerator({
  templates: {
    "landing/**/*": landingTemplate,
  },
})
```

### Marketing Content

Apply distinct templates across marketing routes:

```ts
reactGenerator({
  templates: {
    "marketing/**/*": marketingTemplate,
    "promo/**/*": promoTemplate,
  },
})
```

### Administrative Interfaces

Enforce uniform structure across admin routes:

```ts
reactGenerator({
  templates: {
    "admin/**/*": adminTemplate,
  },
})
```

## 📄 Fallback Behavior

Routes without pattern matches receive the generator's default template
(displaying route name as placeholder for your implementation).

Override the universal default:

```ts
reactGenerator({
  templates: {
    "**/*": myDefaultTemplate,
  },
})
```

This replaces the generator's fallback for all routes.

## 💡 Implementation Guidelines

**Maintain template focus**<br>
Reserve custom templates for routes requiring structural differences, not
cosmetic variations.

**Leverage layout components**<br>
Import shared layouts within templates rather than duplicating structure
across template definitions.

**Plan for maintainability**<br>
Templates exist as configuration strings. Complex templates warrant external
file generation strategies.

**Validate thoroughly**<br>
Custom templates bypass default generator patterns, requiring verification of
routing and parameter handling compatibility.
