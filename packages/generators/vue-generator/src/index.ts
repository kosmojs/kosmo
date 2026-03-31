import { defineGenerator, type GeneratorMeta } from "@kosmojs/lib";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/vue-generator/package.json" with { type: "json" };

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
