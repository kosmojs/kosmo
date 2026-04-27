export type ComponentLoader = () => Promise<{
  loader?: (arg: unknown) => Promise<unknown>;
}>;

export const loaderFactory = (opt?: { withPreload?: boolean }) => {
  return (componentLoader: ComponentLoader) => {
    const loader = async (arg: unknown) => {
      try {
        const component = await componentLoader();
        return typeof component.loader === "function"
          ? component.loader(arg)
          : undefined;
      } catch (error) {
        console.error(error);
        return;
      }
    };
    return opt?.withPreload ? { loader } : {};
  };
};
