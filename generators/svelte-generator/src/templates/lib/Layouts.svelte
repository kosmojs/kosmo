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
   * */
  import { setRouteContext, type LayoutsProps } from "./svelte";

  let { app, layouts, page, route }: LayoutsProps = $props();

  setRouteContext(() => route);

  const chain = $derived([...layouts].reverse().concat(app));
</script>

{#snippet layer(index: number)}
  {#if index < chain.length}
    {@const Layout = chain[index]}
    <Layout>
      {@render layer(index + 1)}
    </Layout>
  {:else}
    {@const Page = page}
    <Page />
  {/if}
{/snippet}

{@render layer(0)}
