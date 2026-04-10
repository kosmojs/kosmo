import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "Vue",
    dependencies: {
      vue: self.devDependencies.vue,
      "vue-router": self.devDependencies["vue-router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@vitejs/plugin-vue": self.devDependencies["@vitejs/plugin-vue"],
    },
    jsxImportSource: "vue",
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});
