---
title: MDX Content
description: Create content-focused source folders with MDX - static HTML rendering
  with Preact, nested layouts, frontmatter-driven head injection, typed navigation,
  and optional static site generation. No client-side JavaScript by default.
head:
  - - meta
    - name: keywords
      content: mdx content, static site, preact ssr, markdown components, frontmatter,
        nested layouts, static generation, ssg, content site, documentation site,
        kosmojs mdx, mdx generator
---

MDX source folders are purpose-built for content: documentation, blogs,
marketing pages, and any site where prose matters more than interactivity.
Pages are authored in MDX (Markdown with JSX), rendered to static HTML on the
server with Preact, and delivered with minimal client-side JavaScript by default.

The same directory-based routing, nested layouts, and type-safe navigation
used by React, SolidJS, and Vue source folders apply for MDX as well.

## 🛠️ Enabling the Generator

MDX generator automatically enabled when creating a source folder and
selecting MDX as the framework. To add one to an existing folder:

```ts [kosmo.config.ts]
import {
  // ...
  mdxGenerator, // [!code ++]
} from "@kosmojs/dev";

import frontmatterPlugin from "remark-frontmatter"; // [!code ++:2]
import mdxFrontmatterPlugin from "remark-mdx-frontmatter";

export default defineConfig({
  // ...
  generators: [
    // ...
    mdxGenerator({ // [!code ++:3]
      remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin]
    }),
  ],
});
```

## 📄 Writing Pages

Pages are `.mdx` or `.md` files in your `pages/` directory.
Standard markdown syntax works alongside JSX components:

```mdx [pages/blog/index.mdx]
---
title: Blog
description: Latest posts and updates.
---

import Alert from "./Alert.tsx"

# Welcome to the Blog

Regular markdown works as expected - **bold**, *italic*, `code`,
[links](/about), and everything else.

<Alert type="info">
  JSX components work inline with markdown content.
</Alert>

## Recent Posts

- First post about KosmoJS
- Getting started with MDX
```

Frontmatter is defined in YAML between `---` fences.
It drives `<head>` injection and is accessible to layouts via props.

## 🧩 Using Components

Import Preact components directly into MDX files. TypeScript, props, hooks -
everything works in the `.tsx` file. The MDX file stays focused on content:

::: code-group
```tsx [pages/blog/Alert.tsx]
import type { JSX } from "preact";

export default function Alert(props: {
  type: "info" | "warning" | "error";
  children: JSX.Element;
}) {
  return (
    <div class={`alert alert-${props.type}`}>
      {props.children}
    </div>
  );
}
```

```mdx [pages/blog/index.mdx]
import Alert from "./Alert.tsx"

<Alert type="warning">
  Keep TypeScript in `.tsx` files - MDX only supports plain JavaScript.
</Alert>
```
:::

### Global Component Overrides

Every markdown element (`# heading`, `` `code` ``, `[link](url)`) compiles to
a JSX call. Override any of them globally via the component map in
`components/mdx.tsx`:

```tsx [src/components/mdx.tsx]
import Link from "./Link";

export const components = {
  Link,

  // custom heading with anchor links
  h1: (props) => (
    <h1 id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}>
      {props.children}
    </h1>
  ),

  // syntax-highlighted code blocks
  pre: (props) => <pre class="code-block" {...props} />,
};
```

These overrides apply to all MDX pages via the `MDXProvider`.
Individual pages can still import and use additional components directly.

## 🍀 Nested Layouts

Layouts work identically to other frameworks -
a `layout.mdx` file wraps all pages and nested layouts within its folder:

```txt
pages/
├── index/
│   └── index.mdx         ← wrapped by root layout
├── docs/
│   ├── layout.mdx        ← wraps all docs/* pages
│   ├── links/
│   │   └── index.mdx     ← wrapped by root + docs layout
│   └── guide/
│       ├── layout.mdx    ← wraps all docs/guide/* pages
│       └── setup/
│           └── index.mdx ← wrapped by root + docs + guide layout
```

For `/docs/guide/setup` the render order is:

```
App.mdx (root layout)
└── pages/docs/layout.mdx
    └── pages/docs/guide/layout.mdx
        └── pages/docs/guide/setup/index.mdx
```

### Writing Layouts

Layouts receive `props.children` (the wrapped content) and
`props.frontmatter` (from the matched page):

```mdx [pages/docs/layout.mdx]
<nav>
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
</nav>

<main>
  {props.children}
</main>

<footer>
  Built with KosmoJS
</footer>
```

Access the page's frontmatter for dynamic head content or conditional rendering:

```mdx [pages/layout.mdx]
<div class="page-wrapper">
  {props.frontmatter.title && (
    <header>
      <h1>{props.frontmatter.title}</h1>
    </header>
  )}
  {props.children}
</div>
```

Layouts must be `.mdx` files - `.md` files cannot render `{props.children}`.

### Global Layout via App.mdx

`App.mdx` at the source folder root wraps every page - the right place
for truly global concerns like site-wide navigation, footer, or
analytics scripts:

```txt
src/content/
├── App.mdx              ← wraps everything
└── pages/
    ├── layout.mdx
    └── index/
        └── index.mdx
```

## 🛣️ Route Parameters

MDX pages support the same parameter syntax as other source folders:

```txt
pages/
  blog/
    post/
      [slug]/
        index.mdx        ➜ /blog/post/:slug
    {category}/
      index.mdx          ➜ /blog/:category (optional)
      {tag}/
        index.mdx        ➜ /blog/:category/:tag (both optional)
```

Access parameters inside a component using `useParams()`:

::: code-group
```tsx [pages/blog/[slug]/PostHeader.tsx]
import { useParams } from "_/use";

export default function PostHeader() {
  const { slug } = useParams();
  return <h1>{slug}</h1>;
}
```

```mdx [pages/blog/[slug]/index.mdx]
---
title: Blog Post
---

import PostHeader from "./PostHeader.tsx"

<PostHeader />
```
:::

`useRoute()` provides the full route context including name, params, and frontmatter:

```tsx
import { useRoute } from "_/use";

export default function Breadcrumb() {
  const { name, params, frontmatter } = useRoute();
  return <nav>...</nav>;
}
```

> **Important:** hooks must be called inside a component's render function,
> not at module scope. `export const params = useParams()` in an MDX file
> runs on import and will fail.

## 🔗 Type-Safe Navigation

The generator produces a typed `Link` component at `components/Link.tsx`:

```mdx
import Link from "~/components/Link"

Navigate to the <Link to={["blog/[slug]", "hello-world"]}>first post</Link>
or go <Link to={["index"]}>home</Link>.
```

The `to` prop accepts the same typed tuple as other frameworks - route name
followed by parameters. TypeScript enforces correct parameter types at
compile time.

> **Tip:** When `Link` is enabled in `components/mdx.tsx` (the default),
> it can be used in pages without import - it is a global component provided via `MDXProvider`.

## 📥 Frontmatter & Head Injection

Frontmatter drives `<head>` content automatically. The SSR server reads
`title`, `description`, and the `head` array from frontmatter and injects
them into the HTML template:

```mdx
---
title: Getting Started
description: Set up your first MDX source folder.
head:
  - - meta
    - name: keywords
      content: mdx, kosmojs, getting started
  - - link
    - rel: canonical
      href: https://kosmojs.dev/docs/getting-started
---
```

Produces:

```html
<head>
  <title>Getting Started</title>
  <meta name="description" content="Set up your first MDX source folder.">
  <meta name="keywords" content="mdx, kosmojs, getting started">
  <link rel="canonical" href="https://kosmojs.dev/docs/getting-started">
</head>
```

This follows the same convention used by VitePress - no new syntax to learn.

## 🏗️ Application Structure

The MDX generator produces the same foundational files as other frameworks,
maintaining a consistent project structure:

```txt
src/content/
├── App.mdx                ← global layout
├── router.tsx             ← Preact router using createRouter
├── index.html             ← HTML shell with placeholders
├── components/
│   ├── Link.tsx           ← typed navigation component
│   └── mdx.tsx            ← MDXProvider component overrides
├── entry/
│   ├── client.tsx         ← minimal client entry (no hydration)
│   └── server.ts          ← SSR rendering with Preact
└── pages/
    └── *.mdx              ← content pages
```

### Router Configuration

The MDX router uses `createRouter` to resolve routes at render time.

```tsx [router.tsx]
import { createRouter } from "_/mdx";
import routerFactory from "_/router";

import App from "./App.mdx";
import { components } from "./components/mdx"

export default routerFactory((routes) => {
  const router = createRouter(routes, App, { components });
  return {
    async clientRouter() {
      return router.resolve();
    },
    async serverRouter(url) {
      return router.resolve(url);
    },
  };
});
```

### Client/Server Entry

Both client and server entries follows the same `renderFactory` pattern as React/Solid/Vue.
- Client entry either render the whole page on dev or hydrate the rendered SSR page.
- Server entry factory return `renderToString` with `{ head, html }`.

:::code-group

```tsx [entry/client.tsx]
import { hydrate, render } from "preact";

import renderFactory, { createRoutes } from "_/entry/client";
import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      async mount() {
        const page = await clientRouter();
        render(page.component, root);
      },
      async hydrate() {
        const page = await clientRouter();
        hydrate(page.component, root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}
```

```ts [entry/server.ts]
import { renderToString } from "preact-render-to-string";

import { renderHead } from "_/mdx";
import renderFactory, { createRoutes } from "_/entry/server";
import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);

      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        renderHead(page?.frontmatter),
      );

      const html = page ? renderToString(page.component) : "";

      return { html, head };
    },
  };
});
```
:::

## 📦 Static Site Generation

MDX source folders support SSG for deploying to CDNs without a running server.
The build process renders every route to static HTML files.

For routes with dynamic parameters, use `staticParams` to declare the variants:

```mdx [pages/docs/[slug]/index.mdx]
---
title: Documentation
staticParams:
  - [getting-started]
  - [routing]
  - [validation]
---

# {useParams().slug}
```

The build generates a separate HTML file for each entry:

```txt
dist/ssg/
├── index.html
├── docs/
│   ├── getting-started/index.html
│   ├── routing/index.html
│   └── validation/index.html
└── assets/
    ├── index-abc123.js
    └── index-def456.css
```

Static routes (no parameters) render automatically with no additional configuration.

> **Important:** Dynamic routes without `staticParams` are skipped from SSG build,
> that's it, no static files generated for dynamic routes without `staticParams`.


## 💡 When to Use MDX vs Frameworks

| Use Case | MDX | React / SolidJS / Vue |
|---|---|---|
| Documentation sites | ✅ | ❌ Overkill |
| Marketing / landing pages | ✅ | ❌ Overkill |
| Blog with static content | ✅ | ❌ Overkill |
| Interactive dashboards | ❌ | ✅ |
| Apps with client-side state | ❌ | ✅ |
| Forms with real-time validation | ❌ | ✅ |

The rule is simple: if the source folder is primarily content with occasional
interactive components, use MDX. If it is primarily interactive
with occasional content, use React/Vue/Solid.

## ⚠️ Common Pitfalls

- **No TypeScript in MDX.** Keep typed code in `.tsx` files and import into MDX. MDX only supports plain JavaScript expressions.
- **Hooks at module scope.** `export const x = useHook()` runs on import, not during render. Always call hooks inside component functions.
- **Curly braces in prose.** `{...spread}` in markdown text is parsed as a JSX expression. Use backticks for code containing curly braces: `` `{...spread}` ``.
- **Layouts must be `.mdx`.** Plain `.md` files cannot render `{props.children}` and will not work as layouts.
