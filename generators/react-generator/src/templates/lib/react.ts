export type ComponentLoader = () => Promise<{
  loader?: (arg: unknown) => Promise<unknown>;
}>;

export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const loader = async (arg: unknown) => {
      try {
        const component = await componentLoader();
        // Return null, not undefined, when a route has no loader. RR keys
        // hydration data by route id; an undefined value is dropped by
        // JSON.stringify during serialization, leaving the id absent, which
        // makes RR re-run the loader on the client and double-render. null
        // survives serialization, so the id stays present and RR skips it.
        return typeof component.loader === "function"
          ? await component.loader(arg)
          : null;
      } catch (error) {
        // TODO: swallowing loader errors is wrong. Returning null hydrates the
        // route as "loaded, value null" - RR never sees the failure, so no
        // errorElement/ErrorBoundary fires on server or client, and this
        // console.error runs server-side during SSR so the client sees nothing.
        // Proper fix: let the error reach RR's `context.errors` (rethrow, or
        // return a Response/data() with an error status) so it serializes into
        // __staticRouterHydrationData.errors and renders the route boundary
        // isomorphically.
        console.error(error);
        return null;
      }
    };
    return opt?.withPreload ? { loader } : {};
  };
};
