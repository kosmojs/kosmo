import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "Vue",
    dependencies({ generators }) {
      return {
        vue: self.devDependencies.vue,
        "vue-router": self.devDependencies["vue-router"],
        "path-to-regexp": self.devDependencies["path-to-regexp"],
        ...(generators.some((e) => e.meta.slot === "tsq")
          ? {
              "@tanstack/vue-query":
                self.devDependencies["@tanstack/vue-query"],
            }
          : {}),
      };
    },
    jsxImportSource: "vue",
  },
  factory,
});
