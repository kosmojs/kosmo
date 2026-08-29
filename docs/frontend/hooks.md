---
title: The _/use Hooks
description: Reference for the generated _/use module - useLoaderData, useParams, useRoute,
    useParamsEntries, useSearchParams and useFrontmatter - and which frameworks provide it.
head:
  - - meta
    - name: keywords
      content: _/use, useLoaderData, useParams, useRoute, useSearchParams, useFrontmatter,
        useParamsEntries, vue hooks, svelte hooks, mdx hooks, kosmojs hooks
---

`_/use` is a small generated module holding the hooks a page needs that its router doesn't already provide.

::: warning It does not exist for every framework
`_/use` is generated **only for Vue, Svelte and MDX folders**. React and SolidJS folders
have no `_/use` at all - React Router and Solid Router already cover this ground, so you
import from them instead.
An `import { ... } from "_/use"` in a React or SolidJS folder will not resolve.
:::

## What each framework provides

| | React | SolidJS | Vue | Svelte | MDX |
|---|:---:|:---:|:---:|:---:|:---:|
| `_/use` exists | ❌ | ❌ | ✅ | ✅ | ✅ |
| `useLoaderData` | – | – | ✅ | ✅ | ✅ |
| `useRoute` | – | – | – | ✅ | ✅ |
| `useParams` | – | – | – | ✅ | ✅ |
| `useParamsEntries` | – | – | – | ✅ | ✅ |
| `useSearchParams` | – | – | – | ✅ | ✅ |
| `useFrontmatter` | – | – | – | – | ✅ |

Where a cell is empty, use the framework's own equivalent:

| Need | React | SolidJS | Vue |
|---|---|---|---|
| loader data | `useLoaderData` from `react-router` | `createAsync` from `@solidjs/router` | `useLoaderData` from `_/use` |
| route params | `useParams` from `react-router` | `useParams` from `@solidjs/router` | `useRoute` from `vue-router` |
| search params | `useSearchParams` from `react-router` | `useSearchParams` from `@solidjs/router` | `useRoute().query` |

## `useLoaderData`

```ts
useLoaderData<T>(key?: string): T | undefined
```

Reads the result of the page's `loader` export, resolved before render.

```vue
<script setup lang="ts">
import { useLoaderData } from "_/use";
import type { ResponseT } from "_/fetch";

const user = useLoaderData<ResponseT["users/[id]"]["GET"]>();
</script>
```

Two things to keep in mind:

- **It returns `T | undefined`.** The loader resolves before render in the normal case,
but the type is honest about routes that declare no loader.
Annotate the read and handle the empty case (`v-if="user"`, `{#if user}`) rather than asserting.
- **In a layout, pass the key.** Vue, Svelte and MDX share one per-route store keyed by route name,
and the hook cannot tell which layout it is running in.
A page passes nothing; a layout passes its path-qualified name:

```ts
const data = useLoaderData("dashboard/layout");   // pages/dashboard/layout.*
```

[Details&nbsp;›](/frontend/layouts#data-loading-in-layouts)

## `useParams`

```ts
useParams<RouteName>(): ParamsMap[RouteName]
```

Svelte and MDX only. Pass the route name as a type argument and the params come back typed for that route -
required params as values, optional ones possibly `undefined`, a splat as an array:

```svelte
<script lang="ts">
import { useParams } from "_/use";

const { slug } = useParams<"blog/[slug]">();
</script>
```

## `useRoute`

Returns the whole route context in one object - `name`, `params`, `paramsEntries`,
`searchParams`, `loaderData`, and on MDX also `frontmatter`.
Useful in a shared component (a breadcrumb, a title bar) that needs to know where it is without being handed props:

```tsx
import { useRoute } from "_/use";

export default function Breadcrumb() {
  const { name, params } = useRoute();
  // ...
}
```

## `useParamsEntries`

Returns `[keys, values]` - both arrays in the order the route declares its parameters,
which is exactly the order a fetch client expects:

```ts
const [keys, values] = useParamsEntries<"users/[id]/posts/[postId]">();
await fetchClients["users/[id]/posts/[postId]"].GET(values);
```

Prefer this over rebuilding an array from `useParams()`.
Object key order is insertion order in practice, but it is not tied to how the route declares its parameters -
`useParamsEntries` is correct by construction.
[Details&nbsp;›](/frontend/mdx#loaders-with-route-parameters)

## `useSearchParams`

Returns the current query string as parsed search params, for reading `?page=2&sort=date` on the page side.

> This is *route-level* search state.
Validating and typing query parameters is a separate concern handled on the API contract,
through the `query` validation target and the generated fetch clients.
[Details&nbsp;›](/validation/payload#validation-targets)

## `useFrontmatter`

MDX only. Reads the current page's YAML frontmatter,
for dynamic head content or conditional rendering in a layout:

```mdx
import { useFrontmatter } from "_/use";

export const Header = () => {
  const { title } = useFrontmatter();
  return title ? <h1>{title}</h1> : null;
};
```

[Details&nbsp;›](/frontend/mdx#frontmatter-head-injection)

## Two Rules That Bite

**Hooks run during render, never at module scope.** A hook call in a module-level export runs on import,
before any component exists:

```mdx
export const params = useParams();   // ❌ runs on import, fails
export const P = () => useParams();  // ✅ runs during render
```

This is also why a `loader` cannot use hooks - it runs before the component tree exists.
It receives the resolved route object as its argument instead.
[Details&nbsp;›](/frontend/mdx#loaders-with-route-parameters)

**On Svelte, read them during component initialisation.** The Svelte hooks read Svelte context,
so - like any `getContext()` call - they are only valid at the top level of a `<script>` block.
Calling one inside an event handler or a callback that runs later will not work:

```svelte
<script lang="ts">
import { useParams } from "_/use";

const { id } = useParams<"users/[id]">();   // ✅ top level

function onClick() {
  const p = useParams<"users/[id]">();      // ❌ too late, no context
}
</script>
```
