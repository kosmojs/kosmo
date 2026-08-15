export type ComponentLoader = () => Promise<{
  loader?: (arg: unknown) => Promise<unknown>;
}>;

export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const loader = async (arg: unknown) => {
      const component = await componentLoader();
      // Return null, not undefined, when a route has no loader.
      // React Router keys hydration data by route id;
      // an undefined value is dropped by JSON.stringify during serialization,
      // leaving the id absent, which makes RR re-run the loader on the client and double-render.
      // null survives serialization, so the id stays present.
      return typeof component.loader === "function"
        ? await component.loader(arg)
        : null;
    };
    return opt?.withPreload ? { loader } : {};
  };
};
