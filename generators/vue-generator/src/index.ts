import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Vue",
    slot: "frontend",
    jsxImportSource: "vue",
  },
  dependencies({ frontend }) {
    return {
      vue: self.devDependencies.vue,
      "vue-router": self.devDependencies["vue-router"],
      ...(frontend?.tanstack?.query
        ? {
            "@tanstack/vue-query": self.devDependencies["@tanstack/vue-query"],
          }
        : {}),
    };
  },
  factory,
});
