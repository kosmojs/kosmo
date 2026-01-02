---
title: React - Automated Route Configuration
description: Watch-based route generation transforming pages directory into
  React Router configuration. Lazy-loaded components, loader integration, and
  parameter syntax transformation from KosmoJS structure.
head:
  - - meta
    - name: keywords
      content: react route generation, automatic routing, lazy components react,
        loader integration, route parameters react, code splitting, react
        router automation, dynamic imports
---

`React` generator maintains continuous observation of your `pages`
directory, detecting new components and transforming them into route
configurations automatically.

Component creation triggers analysis of its filesystem location, generating
corresponding route configuration written to your `lib` directory for router
import.

The generator performs automatic parameter syntax transformation, converting
filesystem bracket notation (`[id]`) into React Router's colon-prefix format
(`:id`).

Component implementation leverages lazy loading, excluding route code from
initial JavaScript bundles. Each route's code fetches on-demand when users
navigate to that specific path.

This universal lazy-loading approach yields significantly reduced initial
payloads, accelerating application startup. Visitors download code selectively
according to navigation patterns rather than receiving the complete
application upfront.

Route definitions incorporate loader functions automatically. When page
components export `loader` functions, the router executes them at strategic
moments: initial page load, link hover events, or navigation initiation.

This proactive data retrieval enhances user experience by acquiring necessary
information before component rendering, creating more responsive application
behavior.
