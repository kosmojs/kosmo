import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Svelte",
    slot: "frontend",
  },
  dependencies({ frontend }) {
    // path-to-regexp added by core-generator, do not duplicate here
    return {
      svelte: self.devDependencies.svelte,
      ...(frontend?.tanstack?.query
        ? {
            "@tanstack/svelte-query":
              self.devDependencies["@tanstack/svelte-query"],
          }
        : {}),
    };
  },
  factory,
});
