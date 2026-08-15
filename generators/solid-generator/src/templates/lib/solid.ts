export type ComponentLoader = () => Promise<{
  preload?: () => Promise<unknown>;
}>;

export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const preload = async () => {
      const component = await componentLoader();
      return typeof component.preload === "function"
        ? component.preload
        : undefined;
    };
    return opt?.withPreload ? { preload } : {};
  };
};
