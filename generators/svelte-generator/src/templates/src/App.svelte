<script lang="ts">
  /**
   * Root wrapper rendered around every page - the App layer of
   * [App, ...layouts]. Receives the rest of the chain as `children`.
   * */
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
