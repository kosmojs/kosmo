---
title: Best Practices
description: Proven patterns for building React, SolidJS, and Vue applications
  with KosmoJS - data loading strategies, type-safe navigation, Suspense
  boundaries, state management, and architectural guidance.
head:
  - - meta
    - name: keywords
      content: react best practices, solidjs best practices, vue best practices,
        loader strategy, preload pattern, suspense boundaries, type-safe links,
        state management, react query, createResource, vue composition api,
        kosmojs patterns, architecture
---

Building applications with `KosmoJS` benefits from these patterns and
architectural approaches, collected across all three supported frameworks.

---

#### 🔄 Match Data Loading Strategy to Timing

Use route-level data loading for information that must exist before user
interaction. Loaders and preloads eliminate loading spinners by fetching ahead
of component mount, creating seamless navigation.

Reserve component-level fetching for data that depends on post-mount user
actions - sorting, filtering, pagination. This granular approach gives precise
control over fetch timing and loading/error state presentation.

::: code-group

```tsx [React]
// Route-level: loader runs before the component mounts
export const loader = fetchClients["users/data"].GET;

// Component-level: React Query for interaction-driven fetches
const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
```

```tsx [SolidJS]
// Route-level: preload runs on link hover and navigation intent
export { GET as preload };

// Component-level: createResource for interaction-driven fetches
const [data] = createResource(fetchUsers);
```

```vue [Vue]
<!-- Route-level: navigation guard in router.ts or onMounted -->
onMounted(async () => { data.value = await fetchUsers(); });

<!-- Component-level: reactive fetch triggered by user action -->
watch(filter, async (val) => { data.value = await fetchUsers(val); });
```

:::

---

#### 🎨 Keep App Component Focused on Shell Concerns

The root App component belongs to application-wide infrastructure: global
error boundaries, authentication providers, theme systems, and top-level
Suspense boundaries. Route-specific logic belongs in route components,
maintaining clear separation of concerns.

---

#### 🔗 Exploit Link Type Safety

Use the `Link` component's compile-time validation for all navigation. Route
identifiers and parameter types are checked at build time - broken links never
reach production. When refactoring routes, TypeScript surfaces every reference
requiring an update, turning a fragile search-and-replace into a guided
checklist.

---

#### 🗂️ Treat `lib` as Generator Output

The `lib/src/` directory is fully managed by the generator. Manual edits disappear
on the next file-system change. Direct all route modifications through the
`pages` directory - the generator keeps route configurations synchronized
automatically.

---

#### 🧮 Place Suspense Boundaries Deliberately

The default App component provides an application-level Suspense boundary. For
granular loading control, add nested boundaries inside route components around
specific UI segments that load independently.

::: code-group

```tsx [React]
// Nested Suspense for independent loading segments
<Suspense fallback={<Spinner />}>
  <HeavyWidget />
</Suspense>
```

```tsx [SolidJS]
<Suspense fallback={<Spinner />}>
  <HeavyWidget />
</Suspense>
```

```vue [Vue]
<Suspense>
  <HeavyWidget />
  <template #fallback>
    <Spinner />
  </template>
</Suspense>
```

:::

---

#### 📦 Embrace Lazy Loading

All routes are lazy-loaded by default. Structure components to handle
asynchronous loading gracefully and lean on Suspense fallbacks for smooth
experiences during code chunk arrivals. Avoid patterns that force eager
imports of route components.

---

#### 🗃️ Scale State Management to Complexity

Start with each framework's built-in primitives:

- **React** - `useState` / `useReducer` + Context for moderate complexity;
  graduate to Zustand or Redux Toolkit when demands exceed simple patterns.
- **SolidJS** - `createSignal` / `createStore` cover most cases;
  reach for more only when cross-component coordination becomes unwieldy.
- **Vue** - `ref` / `reactive` + `provide`/`inject` for shared state;
  Pinia for application-scale state management.

Avoid introducing a state management library prematurely - the built-in
primitives handle more than most applications need.

---

#### 🏗️ Prefer Source Folder Separation over Hybrid Rendering

Rather than implementing complex route-level SSR/CSR switching within a single
source folder, leverage `KosmoJS`'s architectural strength: create separate
source folders for separate concerns. An SSR folder for marketing content, a
CSR folder for the customer application. Cleaner codebases, straightforward
maintenance, and the right rendering strategy applied where it actually matters.

---

#### 🌐 SSR-Specific: Guard Against Browser APIs

Code executing during SSR has no access to `window`, `document`, or other
browser globals. Use `isServer` checks (SolidJS), `typeof window !== "undefined"`
guards (React), or client-only lifecycle hooks (`onMounted` in Vue) to isolate
browser-specific logic.

```ts
// SolidJS
import { isServer } from "solid-js/web";
if (!isServer) { /* browser-only */ }

// React / Vue
if (typeof window !== "undefined") { /* browser-only */ }
```
