---
title: Error Boundaries
description: Catch rendering errors with each framework's native error boundary at the layout level.
    How boundaries behave during client rendering versus server-side rendering.
head:
  - - meta
    - name: keywords
      content: error boundary, react error boundary, getDerivedStateFromError,
        solidjs ErrorBoundary, vue onErrorCaptured, svelte boundary, preact useErrorBoundary,
        ssr error handling, render error, layout error boundary, kosmojs error boundaries
---

When a component throws while rendering, an error boundary catches it and shows fallback UI
instead of letting the failure tear down the surrounding tree.

KosmoJS doesn't ship its own boundary component or wrap your app in one -
each framework already has this mechanism, and you place it where it belongs:
in a [layout](/frontend/layouts), so it wraps the routes beneath it.

## Boundaries Live in a Layout

A `layout` file is the natural home for a boundary. It wraps every route in its
folder and subfolders, so one boundary there covers a whole section of the app
while leaving siblings elsewhere unaffected.

Wrap the layout's child slot - the same slot that renders the nested route - in your framework's boundary:

:::tabs key:frontend variant:code
== React
```tsx
// layout.tsx
import { Component, type ReactNode } from "react";
import { Outlet } from "react-router";

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? <div className="error">Something went wrong.</div>
      : this.props.children;
  }
}

export default function Layout() {
  return (
    <Boundary>
      <Outlet />
    </Boundary>
  );
}
```

== Solid
```tsx
// layout.tsx
import type { ParentComponent } from "solid-js";
import { ErrorBoundary } from "solid-js";

const Layout: ParentComponent = (props) => {
  return (
    <ErrorBoundary fallback={(err) => <div class="error">Something went wrong.</div>}>
      {props.children}
    </ErrorBoundary>
  );
};

export default Layout;
```

== Vue
```vue
// layout.vue
<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";

const failed = ref(false);
onErrorCaptured(() => {
  failed.value = true;
  return false;
});
</script>

<template>
  <div v-if="failed" class="error">Something went wrong.</div>
  <RouterView v-else />
</template>
```

== Svelte
```svelte
// layout.svelte
<script lang="ts">
let { children } = $props();
</script>

<svelte:boundary>
  {@render children()}

  {#snippet failed(error, reset)}
    <div class="error">Something went wrong.</div>
  {/snippet}
</svelte:boundary>
```

== MDX
```mdx
// layout.mdx
import { Boundary } from "~/components/Boundary";

<Boundary>
  {props.children}
</Boundary>
```
:::

MDX renders through a Preact host, so its boundary is a small Preact component
you import into the layout. Keep it in a `.tsx` file (MDX itself holds no TypeScript) using Preact's `useErrorBoundary` hook:

```tsx
// components/Boundary.tsx
import type { ComponentChildren } from "preact";
import { useErrorBoundary } from "preact/hooks";

export function Boundary({ children }: { children: ComponentChildren }) {
  const [error] = useErrorBoundary();
  if (error) return <div class="error">Something went wrong.</div>;
  return <>{children}</>;
}
```

Each of these uses the framework's own built-in primitive:
- React's class boundary with `getDerivedStateFromError`
- SolidJS's `<ErrorBoundary>`
- Vue's `onErrorCaptured`
- Svelte's `<svelte:boundary>`
- Preact's `useErrorBoundary` for MDX.

There's nothing KosmoJS-specific to learn; you use your framework's native boundary.

## Client Rendering and Server Rendering Differ

On the client, all five behave the way you expect: when a route below the
boundary throws during render, the boundary catches it and swaps in the fallback,
and the rest of the page keeps working. For a CSR folder this is the whole story.

Server-side rendering is where the behavior diverges,
and it's worth understanding before you rely on a boundary to rescue a bad server render.
The distinction that matters is *when* the error is thrown:

- An error thrown **asynchronously**, after a component's shell has already rendered -
a lazy or suspended subtree that fails while resolving - is contained on the server: the render survives and produces HTML.
Whether that HTML holds the boundary's fallback is framework-specific.
Solid can emit it in the same pass; React never does - the server emits the enclosing *Suspense* fallback instead,
the client retries the subtree, and the error boundary takes over there.
- An error thrown **synchronously**, at the top of a component's render on the initial pass (a "shell" error), is handled differently.
This is the case a page that throws immediately in its render body falls into.

For a synchronous shell throw, only Solid renders the boundary's fallback on
the server. Its fine-grained model re-runs the boundary during the same render
and emits the fallback HTML, in both string and streaming output.

In React, Svelte, and MDX (Preact), the throw escapes the render call
rather than producing the boundary's fallback markup on the server.

In Vue, `onErrorCaptured` stops the error from propagating but the fallback branch isn't rendered in that same server pass.

In every one of those four cases the boundary still works normally once the
app hydrates on the client - the difference is confined to the initial server render.

This is upstream framework behavior, not a KosmoJS limitation, and it isn't something a config option changes.

In particular, the [`renderMode`](/frontend/server-side-render#selecting-the-render-mode)
setting (string versus stream) does not change the outcome for a synchronous shell throw -
streaming helps only with errors thrown after a shell has already flushed,
and streamed routes carry their own recovery caveats -
see [Fetch Errors and Recovery](/frontend/server-side-render#fetch-errors-and-recovery).

The practical consequence: a boundary is the right tool for recoverable
rendering errors in interactive subtrees, and it protects the client render in
every framework.

But don't lean on it to turn a hard server-render failure into a graceful server-rendered fallback -
a page that throws synchronously at the top of its render will not produce boundary fallback HTML on the server.

Handle those at the source: guard the code that can throw,
resolve data in a [loader or preload](/frontend/data-preload) so a failure surfaces through
the framework's data channel before render, and keep the boundary for the in-tree errors it catches well.

## Where This Fits

Boundaries handle errors thrown *while rendering*. They're one piece of a larger picture:

- Data-layer failures - a fetch client call that returns an HTTP error or throws on a network fault -
surface through the mechanism you read the data with.
See [Fetch Error Handling](/fetch/error-handling) for how a rejected request reaches a boundary in an event handler.
- Backend errors are separate again, centralized in `api/errors.ts`.
See [Backend Error Handling](/backend/error-handling).
- A render error the server could not contain is **reported**, not caught, through the renderers'
[`onError`](/frontend/server-side-render#onerror-hook) hook -
the place to log or trace what a server-side boundary could not turn into fallback markup.
- A boundary is for render-time errors in a subtree;
the root [`app` file](/frontend/layouts#global-layout-via-app-file) is where a truly
global boundary would go if you want one that wraps everything.
