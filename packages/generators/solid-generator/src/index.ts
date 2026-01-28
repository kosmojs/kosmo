import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "SolidJS",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
    dependencies: {
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "solid-js": self.devDependencies["solid-js"],
    },
    devDependencies: {
      "vite-plugin-solid": self.devDependencies["vite-plugin-solid"],
    },
  };
};
