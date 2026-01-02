import type { GeneratorConstructor } from "@kosmojs/dev";

import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "React",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
  };
};
