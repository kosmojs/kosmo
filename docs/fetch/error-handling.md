---
title: Fetch Client Error Handling
description: Fetch clients always throw on failure, so every failure is catchable.
    Distinguish ValidationError from network and server errors,
    and handle them with a try-catch or an error boundary at layout or app level.
head:
  - - meta
    - name: keywords
      content: fetch error handling, ValidationError, error boundary, try-catch,
        network errors, loader errors, tanstack query errors, throwOnError
---

Fetch clients always **throw on failure**.

Every failure - a validation error before the request, an HTTP error status, or a network/transport failure -
surfaces as a thrown error you can catch.

The return type stays the response type; a failed call never resolves to `undefined`,
and nothing is silently swallowed.

## Catching Errors

Wrap a call in `try/catch` and branch on the error type:

```ts [pages/example/index.tsx]
import fetchClients, { ValidationError } from "_/fetch";

const useFetch = fetchClients["users/[id]"];

try {
  const response = await useFetch.POST([userId], payload);
} catch (error) {
  if (error instanceof ValidationError) {
    // data didn't pass validation - no request was made
    console.error("Invalid data:", error.errorMessage);
  } else {
    // network error, or an HTTP error status from the server
    console.error("Request failed:", error);
  }
}
```

Three failure kinds reach that `catch`:

- **`ValidationError`** - parameters or payload failed client-side validation.
Thrown before any network request, so nothing was sent.
Carries the same structured detail as a server-side `ValidationError`,
so you can surface field-level feedback immediately. [Details ›](/validation/error-handling)
- **HTTP error status** - the request was sent and the server responded with a non-2xx status.
The thrown error carries the response and the parsed error body.
- **Network / transport failure** - the request never completed
(DNS failure, connection refused, server down). The original transport error is thrown.

Every failure throws, so a plain `try/catch` around the call catches it. Nothing is swallowed.

## Error Boundaries

For anything beyond a single call, you don't want a `try/catch` per call -
you want one place that catches failures for a whole subtree.
That is an **error boundary**, mounted at layout level.

Because the client throws naturally, a fetch failure propagates like any other thrown error
and the nearest boundary catches it - so one boundary covers every call rendered beneath it.

Each framework provides its own boundary; mount it where you want failures to be caught
(usually the layout, so it wraps every page):

- **React** - an error boundary component (a class boundary or `react-error-boundary`).
- **Solid** - `<ErrorBoundary fallback={...}>` from `solid-js` around the layout's content.
- **Vue** - a wrapper using `onErrorCaptured`, or `app.config.errorHandler` globally.
- **Svelte** - `<svelte:boundary>` where available, otherwise handle at the data/load layer.
- **MDX** - renders through Preact, so it uses a Preact boundary (`useErrorBoundary` from `preact/hooks`).

A layout-level boundary for each framework:

::: code-group

```tsx [React]
import { ErrorBoundary } from "react-error-boundary";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>Something went wrong: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

```tsx [Solid]
import { ErrorBoundary, type ParentProps } from "solid-js";

export default function Layout(props: ParentProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div role="alert">
          <p>Something went wrong: {String(error.message ?? error)}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err as Error;
  return false; // stop the error from propagating further
});

const reset = () => (error.value = null);
</script>

<template>
  <div v-if="error" role="alert">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="reset">Try again</button>
  </div>
  <slot v-else />
</template>
```

```svelte [Svelte]
<script lang="ts">
  let { children } = $props();
</script>

<svelte:boundary>
  {@render children()}

  {#snippet failed(error, reset)}
    <div role="alert">
      <p>Something went wrong: {error instanceof Error ? error.message : String(error)}</p>
      <button onclick={reset}>Try again</button>
    </div>
  {/snippet}
</svelte:boundary>
```

```tsx [MDX]
import { useErrorBoundary } from "preact/hooks";
import type { ComponentChildren } from "preact";

// MDX pages render through Preact; wrap {props.children} in your layout with this.
export default function ErrorBoundary(props: { children: ComponentChildren }) {
  const [error, reset] = useErrorBoundary();
  if (error) {
    return (
      <div role="alert">
        <p>Something went wrong: {error instanceof Error ? error.message : String(error)}</p>
        <button onClick={reset}>Try again</button>
      </div>
    );
  }
  return props.children;
}
```

:::

A boundary catches errors thrown **during render**.
The two paths below are about getting each kind of failure onto that render path.

## Where Errors Surface

### TanStack Query

When a call runs inside `createQuery` / `useQuery`, TanStack catches the exception
and stores it in `query.error` - it does **not** throw during render by default, so no boundary fires.

Read `query.error` to handle it inline, or set `throwOnError` to escalate the error into the nearest boundary:

```ts
const query = createQuery(() => ({
  queryKey: ["user", id()],
  queryFn: () => fetchClients["users/[id]"].GET([id()]),
  throwOnError: true, // let the error boundary catch it instead of query.error
}));
```

Use `query.error` for inline, per-widget error UI; use `throwOnError` when a
failed load should hand off to the same layout-level boundary as everything else.

### Route loaders

A fetch call inside a route `loader` (React Router) or `preload` (Solid) reaches
the framework's own route-error channel:
- *React Router* surfaces the error through the route's `errorElement` (read it with `useRouteError`),
rendered the same on the server render and after hydration.
- *Solid* surfaces it through the resource so a downstream `<ErrorBoundary>` under `<Suspense>` catches it.

Handle loader errors with the framework's route-level error UI, not with a `try/catch` inside the loader -
catching inside the loader hides the failure from the machinery designed to render it.

### Event handlers and mutations

A fetch call in a click or submit handler (including a TanStack mutation) runs outside render,
so a render boundary can't see it. Handle these with a local `try/catch` where the call is made,
and read `mutation.error` for mutation state.

## Defense in Depth

Client-side validation catches bad input before a request is sent,
but it is a UX convenience, not a security boundary.

The server always re-validates with the same schemas.
Treat client validation as fast feedback and the server's `ValidationError` response as the authority.
[Details ›](/fetch/validation)
