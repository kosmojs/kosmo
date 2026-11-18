<script lang="ts">
  /**
   * Folds [app, ...layouts] around the page component.
   *
   * MDX does this with `reduce((children, layout) => h(layout, { children }))`.
   * Svelte has no vnode children to reduce over, so the chain is walked with a
   * recursive snippet and the page is rendered at the leaf.
   *
   * Layouts receive nothing but their `children` snippet - same as MDX, where
   * a layout gets only `props.children`. Route data is read from context via
   * useRoute()/useParams()/useLoaderData().
   *
   * On client-side navigation this component stays mounted and its props change.
   * A layout at the same depth in both routes is the same component,
   * so it stays mounted with its state; the page is keyed by the route object,
   * new on every navigation, so it mounts anew even when only the query changed -
   * a page reads its route once, at init.
   * */
  import { setRouteContext, type LayoutsProps } from "./svelte";

  let { app, layouts, page, route }: LayoutsProps = $props();

  setRouteContext(() => route);

  const chain = $derived([app, ...layouts.toReversed()]);
</script>

{#snippet layer(index: number)}
  {#if index < chain.length}
    {@const Layout = chain[index]}
    <Layout>
      {@render layer(index + 1)}
    </Layout>
  {:else}
    {@const Page = page}
    {#key route}
      <Page />
    {/key}
  {/if}
{/snippet}

{@render layer(0)}
