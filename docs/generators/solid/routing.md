---
title: SolidJS - Routing
description: Automatic route generation from pages directory with lazy-loaded components,
    preload functions, and SolidJS Router parameter syntax conversion from KosmoJS directory structure.
head:
  - - meta
    - name: keywords
      content: solidjs routing, lazy loading, route parameters, preload function,
        dynamic imports, solidjs router config, route generation
---

The `SolidJS` generator continuously watches your `pages/` directory for components.

When you create a page component, the generator analyzes its location
and creates a corresponding route configuration.

These route configurations are written to your `lib` directory
and imported by your router.

For a component at `pages/users/[id]/index.tsx`,
the generator creates a route configuration like this:

```ts
{
  path: "/users/:id",
  component: lazy(() => import("@/front/pages/users/[id]")),
  preload: () =>
    import("@/front/pages/users/[id]").then(
      (mdl) => (mdl as ComponentModule).preload?.()
    ),
}
```

The path uses `SolidJS` Router's parameter syntax (`:id` instead of `[id]`),
automatically converting `KosmoJS`'s directory naming to the router's expectations.

The component is lazy-loaded, which means it's not included in your initial bundle-
it loads on demand when the route is accessed.

All components are lazy-loaded by default.
This keeps initial bundle sizes small and improves application startup time.
Users only download the code for routes they actually visit.

The route configuration also includes a preload function.
If your page component exports a `preload` function, the router calls it in specific situations:
when the component first loads, when users hover over links to that route, or when navigation to that route occurs.

This preloading improves perceived performance
by fetching data before the component actually renders.
