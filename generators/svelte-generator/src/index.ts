import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "Svelte",
    slot: "frontend",
  },
  dependencies(options?: Options) {
    return {
      svelte: self.devDependencies.svelte,
      "path-to-regexp": self.devDependencies["path-to-regexp"],
      ...(options?.tanstack?.query
        ? {
            "@tanstack/svelte-query":
              self.devDependencies["@tanstack/svelte-query"],
          }
        : {}),
    };
  },
  factory,
});
