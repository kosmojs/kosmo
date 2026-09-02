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

## Enabling the Generator

MDX generator is automatically enabled when creating a source folder and
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

## Writing Pages

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
It drives `<head>` injection and is accessible in pages and layouts via
`useFrontmatter()` (or `useRoute().frontmatter`).

## Using Components

Import Preact components directly into MDX files. TypeScript, props, hooks -
everything works in the `.tsx` file. The MDX file stays focused on content:

:::tabs variant:code
== pages/blog/Alert.tsx
```tsx
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

== pages/blog/index.mdx
```mdx
import Alert from "./Alert.tsx"

<Alert type="warning">
  Keep TypeScript in `.tsx` files - MDX only supports plain JavaScript.
</Alert>
```
:::

### Global Component Overrides

Every markdown element (`# heading`, `` `code` ``, `[link](url)`) compiles to
a JSX call. Override any of them globally via the component map in
`components/mdx.ts`:

```tsx [src/components/mdx.ts]
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

## Layouts

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
app.mdx (root layout)
└── pages/docs/layout.mdx
    └── pages/docs/guide/layout.mdx
        └── pages/docs/guide/setup/index.mdx
```

### Writing Layouts

Layouts receive the wrapped content as `props.children`. Everything else -
the page's frontmatter, loader data - is read with hooks, so `props` carries
only what a layout composes around:

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

Access the page's frontmatter with `useFrontmatter()` for dynamic head content
or conditional rendering:

```mdx [pages/layout.mdx]
import { useFrontmatter } from "_/use";

export const Header = () => {
  const frontmatter = useFrontmatter();
  return frontmatter.title ? (
    <header>
      <h1>{frontmatter.title}</h1>
    </header>
  ) : null;
};

<div class="page-wrapper">
  <Header />
  {props.children}
</div>
```

Layouts must be `.mdx` files - `.md` files cannot render `{props.children}`.

### Global Layout via app.mdx

`app.mdx` at the source folder root wraps every page - the right place
for truly global concerns like site-wide navigation, footer, or
analytics scripts:

```txt
src/content/
├── app.mdx              ← wraps everything
└── pages/
    ├── layout.mdx
    └── index/
        └── index.mdx
```

## Route Parameters

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

Access parameters inside a component using `useParams()` from `_/use`.
Pass the route name as a type argument and the returned params are typed for that route:

```mdx [pages/blog/post/[slug]/index.mdx]
import { useParams } from "_/use";

export const Post = () => {
  const { slug } = useParams<"blog/post/[slug]">();
  return <p>Reading: {slug}</p>;
};

# Blog post

<Post />
```

Optional parameters come back possibly-undefined, and a splat parameter comes back
as an array of segments:

```mdx [pages/blog/{category}/{tag}/index.mdx]
import { useParams } from "_/use";

export const Filters = () => {
  const { category, tag } = useParams<"blog/{category}/{tag}">();
  return <p>{category ?? "all"} / {tag ?? "all"}</p>;
};

<Filters />
```

Note the call sits **inside a component**, not at module scope - see the warning below.

`useRoute()` provides the full route context including name, params, frontmatter, and loader data:

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

## Data Fetching

Pages can fetch data during render via a `loader` export - a function that
runs before the page is rendered, on both the server and the client.
It receives the resolved route as first argument, and its return value is read
inside the page with the `useLoaderData()` hook - `props` stays entirely yours.

```mdx [pages/users/index.mdx]
import f from "_/fetch";
import { useLoaderData } from "_/use";

export const loader = f["users"].GET;

export const Message = () => {
  const data = useLoaderData();
  return <p>The message is: {data.msg}</p>;
};

# Welcome

<Message />
```

`loader` fetches through the same client used elsewhere in the project,
so a request made during SSR is captured and replayed on hydration instead of firing twice -
no extra wiring needed on the page.

### Loaders with Route Parameters

`loader` runs before the page tree exists, so it can't use `useParams()`/`useRoute()` -
those are hooks, and hooks only work while Preact is actually
rendering a component. Instead, `loader` receives the resolved route object
directly as first argument:

```ts
// the object passed to `loader` - a subset of the route context,
// without frontmatter or loaderData (which aren't resolved yet at loader time)
type LoaderRoute = {
  name: string;
  params: Record<string, string | Array<string>>;
  paramsEntries: [keys: Array<string>, values: Array<unknown>];
};
```

`paramsEntries` is a `[keys, values]` tuple, both in the same order the route
declares its parameters - the same order `GET` expect:

```mdx [pages/blog/[slug]/index.mdx]
import f from "_/fetch";
import { useLoaderData } from "_/use";

export const { GET } = f["blog/[slug]"];

export const loader = ({ paramsEntries }) => {
  const [keys, params] = paramsEntries;
  return GET(params);
};

export const Title = () => {
  const data = useLoaderData();
  return <h1>{data.title}</h1>;
};

<Title />
```

Pass `params` straight to a parametrized endpoint when only positional values
are needed; `keys` is there alongside it for cases like building a request
body or a cache key from the parameter names themselves. Either way, there's
no need to reconstruct an array from `params`/`useParams()` by hand.

> **Don't** reach for `Object.keys(route.params)`/`Object.values(route.params)`
> as a substitute. It happens to work today because JS object key order
> usually follows insertion order, but that's an implicit contract, not a
> guarantee tied to how the route declares its parameters - it can silently
> break for multi-param or splat routes, or if matching internals ever
> change. `paramsEntries` derives its order from the route's own declared
> parameter list, so it's correct by construction instead of by coincidence.

> **Important:** `loader` runs during resolution, before the component tree
> is built, so it never has access to `useParams()`, `useRoute()`, or any
> other hook - only to the `Route` object passed as its argument. Hooks
> remain the right tool inside actual components;
> `loader` is a pre-render step, not a rendered component.

## Type-Safe Navigation

The generator produces a typed `Link` component at `components/Link.tsx`:

```mdx
import Link from "~/components/Link"

Navigate to the <Link to={["blog/[slug]", "hello-world"]}>first post</Link>
or go <Link to={["index"]}>home</Link>.
```

The `to` prop accepts the same typed tuple as other frameworks - route name
followed by parameters. TypeScript enforces correct parameter types at
compile time.

> **Tip:** When `Link` is enabled in `components/mdx.ts` (the default),
> it can be used in pages without import - it is a global component provided via `MDXProvider`.

## Frontmatter & Head Injection

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

## Application Structure

The MDX generator produces the same foundational files as other frameworks,
maintaining a consistent project structure:

```txt
src/content/
├── app.mdx                ← global layout
├── router.tsx             ← Actual router using createRouter
├── index.html             ← HTML shell with placeholders
├── components/
│   ├── Link.tsx           ← typed navigation component
│   └── mdx.tsx            ← MDXProvider component overrides
├── entry/
│   ├── client.tsx         ← minimal client entry
│   └── server.ts          ← SSR rendering with Preact
└── pages/
    └── *.mdx              ← content pages, optionally exporting `loader`
```

### Router Configuration

The MDX router uses `createRouter` to resolve routes at render time.

```tsx [router.tsx]
import { createRouter } from "_/mdx";
import routerFactory from "_/router";

import App from "./app.mdx";
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

Both client and server entries follow the same `renderFactory` pattern as React/Solid/Vue.
- Client entry either renders the whole page on dev or hydrates the rendered SSR page.
- Server entry factory returns `renderToString` with `{ head, html }`. MDX renders
  static content, so it implements only `renderToString` - it is the one framework
  that omits `renderToStream`.

:::tabs variant:code
== entry/client.tsx
```tsx
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("❌ Root element not found!");
}

```

== entry/server.ts
```ts
import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on MDX folders
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes();

const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```
:::

## When to Use MDX vs Frameworks

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

## Common Pitfalls

- **No TypeScript in MDX.** Keep typed code in `.tsx` files and import into MDX. MDX only supports plain JavaScript expressions.
- **Hooks at module scope.** `export const x = useHook()` runs on import, not during render. Always call hooks inside component functions.
- **`loader` can't use hooks.** `useParams()`, `useRoute()`, and any other hook only work inside a rendered component.
`loader` runs before the tree exists - use the `Route` object passed as its argument (`paramsEntries`, `frontmatter`, etc.) instead.
- **Curly braces in prose.** `{...spread}` in markdown text is parsed as a JSX expression. Use backticks for code containing curly braces: `` `{...spread}` ``.
- **Layouts must be `.mdx`.** Plain `.md` files cannot render `{props.children}` and will not work as layouts.
