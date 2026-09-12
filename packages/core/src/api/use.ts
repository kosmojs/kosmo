export const use = <T, O>(middleware: T | Array<T>, options?: O) => {
  return {
    kind: "middleware" as const,
    middleware: [middleware].flat() as Array<never>,
    options,
  };
};
