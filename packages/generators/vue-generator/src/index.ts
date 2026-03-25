import { defineGenerator } from "@kosmojs/lib";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/vue-generator/package.json" with { type: "json" };

import { factory } from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "Vue",
    dependencies: {
      "vue-router": self.devDependencies["vue-router"],
      vue: self.devDependencies.vue,
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@kosmojs/lib": self.version,
      "@vitejs/plugin-vue": self.devDependencies["@vitejs/plugin-vue"],
    },
  },
);
