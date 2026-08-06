import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "Vue",
    jsxImportSource: "vue",
  },
  dependencies(options?: Options) {
    return {
      vue: self.devDependencies.vue,
      "vue-router": self.devDependencies["vue-router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
      ...(options?.tanstack?.query
        ? {
            "@tanstack/vue-query": self.devDependencies["@tanstack/vue-query"],
          }
        : {}),
    };
  },
  factory,
});
