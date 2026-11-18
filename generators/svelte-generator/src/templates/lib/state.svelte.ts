import type { LayoutsProps } from "./svelte";

/**
 * Props of the mounted <Layouts>, swapped as a whole on client-side navigation.
 *
 * Backed by one `$state.raw` rather than a `$state` proxy:
 * a proxy would deep-wrap the route, loader data included,
 * so components would read proxies instead of the objects loaders returned,
 * and `structuredClone` on them would throw.
 * Getters make the props reactive for `mount()` and `hydrate()` just the same.
 * */
export const createLayoutsProps = (initial: LayoutsProps) => {
  let current = $state.raw(initial);

  const props: LayoutsProps = {
    get app() {
      return current.app;
    },
    get layouts() {
      return current.layouts;
    },
    get page() {
      return current.page;
    },
    get route() {
      return current.route;
    },
  };

  return {
    props,
    update(next: LayoutsProps) {
      current = next;
    },
  };
};
