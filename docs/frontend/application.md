---
title: Application Structure
description: Seeded foundation files for React, SolidJS, Vue, Svelte
    and MDX applications - root app component, AppProvider seam, router configuration
    and client entry point with SSR hydration support.
head:
  - - meta
    - name: keywords
      content: react app foundation, solidjs app structure, vue app, svelte app, mdx app,
        AppProvider, appProvider, provider seam, router integration, createRoot,
        hydration, app entry point, vite entry, solidjs router, vue router, react router.
---

Creating a source folder seeds a small set of foundation files that wire up routing,
navigation, and application bootstrap.

The structure is consistent across frameworks:
a root app component, a router configuration, and a client entry point.

## Root Application Component

A minimal root component is seeded as your application shell.
Extend it with global layouts, error boundaries, authentication providers,
or other application-wide concerns.

The shell composes `AppProvider`, imported from `_/app`, around the routed tree.
`_/app` is a derived seam: a wrapper KosmoJS owns and can swap under the hood.

By default it is a pass-through (it renders its children unchanged),
so out of the box your app behaves exactly like a plain shell.

:::tabs key:frontend variant:code
== React
```tsx
<!--@include: @/parts/frontend/application/root-component.md#react-->
```

== Solid
```tsx
<!--@include: @/parts/frontend/application/root-component.md#solid-->
```

== Vue
```vue
<!--@include: @/parts/frontend/application/root-component.md#vue-->
```

== Svelte
```svelte
<!--@include: @/parts/frontend/application/root-component.md#svelte-->
```

== MDX
```mdx
<!--@include: @/parts/frontend/application/root-component.md#mdx-->
```
:::

### Why the AppProvider seam

Wrapping the shell in `AppProvider` costs nothing when it is a pass-through,
and it buys one thing: features that need to wrap the whole tree in a provider -
a query client, a theme, an auth context - can be enabled without you editing your code.

The pass-through `_/app` is swapped for one that installs the provider,
and the file that composes it is untouched because it already wires `AppProvider` unconditionally.

Toggling such a feature on or off never changes your code.
A plain shell would force you to add and remove the provider wiring by hand each time.

## Router Configuration

The `routerFactory` function in `router.ts` file connects your root app component
and derived routes to the framework's native router.
It accepts a callback receiving derived route definitions from KosmoJS.

The callback must return two functions:

- `clientRouter()` - browser-based routing for client-side navigation
- `serverRouter(url)` - server-side routing for SSR, receiving the requested URL

:::tabs key:frontend variant:code
== React
```ts
<!--@include: @/parts/frontend/application/router.md#react-->
```

== Solid
```ts
<!--@include: @/parts/frontend/application/router.md#solid-->
```

== Vue
```ts
<!--@include: @/parts/frontend/application/router.md#vue-->
```

== Svelte
```ts
<!--@include: @/parts/frontend/application/router.md#svelte-->
```

== MDX
```ts
<!--@include: @/parts/frontend/application/router.md#mdx-->
```
:::

The derived `routes` are always wrapped inside your `app` component,
establishing the layout hierarchy.

## Application Entry

The `entry/client.ts` file is your application's DOM rendering entry point,
referenced from `index.html`:

```html
<script type="module" src="./entry/client.ts"></script>
```

Vite begins from this HTML file, follows the import to `entry/client`, and
constructs the complete application dependency graph from there.

The `renderFactory` function orchestrates two rendering modes via a callback
that must return:

- `mount()` - mounts the application fresh in the browser
- `hydrate()` - hydrates pre-rendered server HTML for interactivity

On page load, `renderFactory` reads `__KOSMO_HYDRATION_BOOL__` flag to select the
correct method: `hydrate()` for SSR hydration, `mount()` for a fresh client-only mount.

:::tabs key:frontend variant:code
== React
```ts
<!--@include: @/parts/frontend/application/entry-client.md#react-->
```

== Solid
```ts
<!--@include: @/parts/frontend/application/entry-client.md#solid-->
```

== Vue
```ts
<!--@include: @/parts/frontend/application/entry-client.md#vue-->
```

== Svelte
```ts
<!--@include: @/parts/frontend/application/entry-client.md#svelte-->
```

== MDX
```ts
<!--@include: @/parts/frontend/application/entry-client.md#mdx-->
```
:::

Under the hood:

- React uses `createRoot`/`hydrateRoot` from `react-dom/client`.
- SolidJS uses `render`/`hydrate` from `solid-js/web`.
- Vue constructs separate app instances via `createApp` and `createSSRApp`.
- Svelte uses `mount`/`hydrate` from `svelte`.
- MDX uses `render`/`hydrate` from `preact`.

The derived `hydrate` and `mount` are conveniences that wire the router to the
DOM the usual way - nothing more.

If you need custom mounting, ignore them and build the component yourself:
the entry only needs to render the router's component into `root`.

Read the derived `_/entry/client` source to see exactly what they do, then substitute your own.
