import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "TypeBox",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
    options: {
      resolveTypes: true,
    },
    dependencies: {
      typebox: self.devDependencies.typebox,
    },
  };
};
