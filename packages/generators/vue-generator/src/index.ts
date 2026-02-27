import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "Vue",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
    dependencies: {
      "vue-router": self.devDependencies["vue-router"],
      vue: self.devDependencies.vue,
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@vitejs/plugin-vue": self.devDependencies["@vitejs/plugin-vue"],
    },
  };
};
