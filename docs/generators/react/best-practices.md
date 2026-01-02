---
title: React - Best Practices
description: Proven patterns for React applications in KosmoJS including loader
  strategies, React Query patterns, type-safe links, and Suspense placement for
  optimal user experience.
head:
  - - meta
    - name: keywords
      content: react patterns, loader strategy, react query patterns, suspense
        placement, type-safe links, react state management, react performance,
        react architecture
---

### 💡 React Best Practices

Building `React` applications with `KosmoJS` benefits from these proven patterns
and architectural approaches.

- Deploy loader functions when routes require data availability at navigation
time. For information that must exist before user interaction, loaders
eliminate loading states by fetching ahead of component mount, creating
seamless navigation experiences.

- Reserve component-level data fetching (like React Query's `useQuery`) for
information dependent on post-mount user actions. This granular approach
provides control over fetch timing and enables sophisticated loading/error
handling tailored to specific UI segments.

- Structure your App component around application-wide infrastructure: global
error boundaries, authentication providers, and theme systems belong here.
Reserve route-specific behavior for individual route components, maintaining
clear separation of concerns.

- Exploit the Link component's type enforcement. Compile-time validation of
route identifiers and parameters catches navigation errors before deployment.
During refactoring, `TypeScript` surfaces every reference requiring updates,
serving as an automated checklist.

- Recognize that `lib` directory contents are generator artifacts. Manual edits
disappear during regeneration. Direct all route modifications through the
`pages` directory, letting the generator maintain synchronized route
configurations.

- Position Suspense boundaries deliberately. The default App component provides
application-level Suspense wrapping. For granular loading control, nest
additional boundaries within route components around specific UI segments
requiring independent loading states.

- Extract route data through `useLoaderData`, which maintains type consistency
with loader functions while preventing re-fetching.

- Combine React's built-in state primitives with Context for moderate
complexity, graduating to Zustand or Redux Toolkit when state management
demands exceed simple patterns.

- Accept universal lazy loading as the default behavior. Structure components
to handle asynchronous loading gracefully, leveraging Suspense fallbacks for
smooth user experiences during code chunk arrivals.
