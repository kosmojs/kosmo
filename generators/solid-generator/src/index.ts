import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "SolidJS",
    slot: "frontend",
    jsx: "preserve",
    jsxImportSource: "solid-js",
  },
  dependencies(options?: Options) {
    return {
      "solid-js": self.devDependencies["solid-js"],
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
      ...(options?.tanstack?.query
        ? {
            "@tanstack/solid-query":
              self.devDependencies["@tanstack/solid-query"],
          }
        : {}),
    };
  },
  factory,
});
