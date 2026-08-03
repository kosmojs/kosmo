import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "Svelte",
    dependencies({ generators }) {
      return {
        svelte: self.devDependencies.svelte,
        "path-to-regexp": self.devDependencies["path-to-regexp"],
        ...(generators.some((e) => e.meta.slot === "tsq")
          ? {
              "@tanstack/svelte-query":
                self.devDependencies["@tanstack/svelte-query"],
            }
          : {}),
      };
    },
  },
  factory,
});
