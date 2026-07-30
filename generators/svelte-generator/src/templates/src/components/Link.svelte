<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";

  import { pageRouteMap, type LinkProps } from "{{ createImport 'libCore' }}";

  let {
    to,
    query,
    children,
    ...rest
  }: Omit<HTMLAnchorAttributes, "href"> & {
    to: LinkProps;
    query?: Record<string | number, unknown>;
    children?: Snippet;
  } = $props();

  const href = $derived.by(() => {
    const [key, ...params] = to;
    return pageRouteMap[key]?.base(params as never, query);
  });
</script>

<a {href} {...rest}>{@render children?.()}</a>
