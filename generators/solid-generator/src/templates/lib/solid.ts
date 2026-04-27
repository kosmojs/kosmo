export type ComponentLoader = () => Promise<{
  preload?: () => Promise<unknown>;
}>;

export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const preload = async () => {
      try {
        const component = await componentLoader();
        return typeof component.preload === "function"
          ? component.preload
          : undefined;
      } catch (error) {
        console.error(error);
        return;
      }
    };
    return opt?.withPreload ? { preload } : {};
  };
};
