import type { RoutePreloadFuncArgs } from "@solidjs/router";

export type ComponentLoader = () => Promise<{
  preload?: (args: RoutePreloadFuncArgs) => unknown;
}>;

/**
 * Route-level `preload` for a page module.
 *
 * Solid Router calls it with `{ params, location, intent }`
 * when the route renders and, with link preloading, on hover or focus;
 * whatever it returns reaches the page as `props.data`.
 * It imports the page module, then runs the page's own `preload` export
 * with those arguments - so the data fetch starts ahead of the component,
 * once the page chunk is in.
 * */
export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const preload = async (args: RoutePreloadFuncArgs) => {
      const { preload } = await componentLoader();
      return typeof preload === "function" ? preload(args) : undefined;
    };
    return opt?.withPreload ? { preload } : {};
  };
};
