<!-- #region react -->
// React: pages/docs/[slug]/index.tsx
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
  ["validation"],
]);

export default function DocsPage() { /* ... */ }
<!-- #endregion react -->

<!-- #region solid -->
// Solid: pages/docs/[slug]/index.tsx
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
  ["validation"],
]);

export default function DocsPage() { /* ... */ }
<!-- #endregion solid -->

<!-- #region vue -->
<!-- Vue: pages/docs/[slug]/index.vue -->
<script lang="ts">
// a plain <script> block: <script setup> can not have named exports,
// and the two blocks coexist in one SFC
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
]);
</script>

<script setup lang="ts">
/* ... */
</script>
<!-- #endregion vue -->

<!-- #region svelte -->
<!-- Svelte: pages/docs/[slug]/index.svelte -->
<script module lang="ts">
// module-level script: its exports are the component module's named exports
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
]);
</script>

<script lang="ts">
  /* ... */
</script>
<!-- #endregion svelte -->

<!-- #region mdx -->
---
title: Documentation
staticParams:
  - [getting-started]
  - [routing]
---

{/* MDX declares staticParams in frontmatter, not as an export */}
<!-- #endregion mdx -->
