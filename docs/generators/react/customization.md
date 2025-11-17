---
title: React - Customize Generated Files
description: Modify generated React files including App.tsx, router.tsx, Link
  component, and entry point. One-time generation preserves your customizations
  through subsequent updates.
head:
  - - meta
    - name: keywords
      content: react file customization, app modification, custom router setup,
        component customization, generator persistence, error boundary setup,
        entry point customization
---

Core generated files - `App.tsx`, `router.tsx`, `entry/client.tsx`, and
`components/Link.tsx` - reside within your source directory rather than the
`lib` folder, granting complete customization ownership.

This placement enables integration of error boundaries into App, specialized
router configurations, Link component enhancement with analytics tracking, or
entry point extension with initialization logic.

These foundational files generate once during initial `React` generator setup.
The generator preserves them across subsequent executions, maintaining your
modifications indefinitely.

Route configurations within `lib` update dynamically as your page structure
evolves, while core application architecture remains under your direct
control.

Generated API clients maintain compatibility with any data fetching approach -
they're promise-returning functions with integrated type safety. Incorporate
them into whatever abstraction layer suits your application's architectural
requirements.
