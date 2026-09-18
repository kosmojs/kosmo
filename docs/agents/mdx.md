---
title: MDX frontend
description: Everything specific to an MDX frontend folder - no TypeScript in .mdx,
    frontmatter-driven staticParams and head, hooks inside components, and layouts.
head:
  - - meta
    - name: keywords
      content: mdx, kosmojs mdx, no typescript in mdx, frontmatter, useFrontmatter,
        useLoaderData, props.children, layout.mdx, staticParams frontmatter, preact
---

A folder with `frontend: { stack: "mdx" }`. Pages are `.mdx`, layouts are `layout.mdx`.
Routing, fetch clients and validation behave the same for every frontend.
[MDX&nbsp;folders&nbsp;›](/frontend/mdx.md)

## No TypeScript in `.mdx`

This is the MDX-specific trap, and it has no workaround. `.mdx` is parsed as plain
JavaScript with JSX - **no type annotations, no type arguments, no type imports**:

```mdx [pages/users/[id]/index.mdx]
{/* MDX: pages/users/[id]/index.mdx */}
import { useLoaderData } from "_/use";

export const Profile = () => {
  // no type argument - the result is untyped
  const user = useLoaderData();
  return <p>{user?.name}</p>;
};

<Profile />
```

`useParams<"users/[id]">()` and `import type { X }` are both syntax errors here.
Keep typed code in a `.tsx` component and import it into the page.

## Hooks run during render

`_/use` exists in MDX folders with the full set, plus `useFrontmatter`.
`export const x = useHook()` at module scope runs on **import**, not during render -
always call hooks inside a component function:

```mdx
export const P = () => useParams();   // runs during render
```

A `loader` cannot use hooks either; it receives the resolved route object, which
carries `paramsEntries` and `frontmatter`.

## Frontmatter drives head and static params

`staticParams` is declared in frontmatter rather than as an export, since a `.mdx`
page has no typed export surface:

```mdx [pages/docs/[slug]/index.mdx]
---
title: Documentation
staticParams:
  - [getting-started]
  - [routing]
---
```

## Layouts

```mdx [layout.mdx]
<!-- MDX: layout.mdx -->
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

Layouts must be `.mdx`. A plain `.md` file cannot render `{props.children}` and
will not work as one.

## Worth knowing

- **SSR is string-only.** `renderMode: "stream"` is not available for MDX folders.
- MDX has no third-party router, so KosmoJS supplies the matcher and emits its own
`RawRoute` shape. [Routing&nbsp;›](/routing/rationale.md)
- The seeded `Link` component is typed in `Link.tsx`, but `.mdx` call sites are not
type-checked, so a wrong route name surfaces at runtime.
- Curly braces in prose are parsed as JSX - wrap them in backticks.
- The default plugin is `@mdx-js/rollup` with a Preact JSX runtime.
