<script lang="ts">
  import { AppProvider } from "{{ createImport 'lib' 'app' }}";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<AppProvider>
  {@render children()}
</AppProvider>
