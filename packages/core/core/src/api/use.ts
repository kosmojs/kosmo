import type { UseOptions } from "./types";

export const use = <T>(middleware: T | Array<T>, options?: UseOptions) => {
  return {
    kind: "middleware" as const,
    middleware: [middleware].flat() as Array<never>,
    options,
  };
};
