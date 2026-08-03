import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "SolidJS",
    dependencies({ generators }) {
      return {
        "solid-js": self.devDependencies["solid-js"],
        "@solidjs/router": self.devDependencies["@solidjs/router"],
        "path-to-regexp": self.devDependencies["path-to-regexp"],
        ...(generators.some((e) => e.meta.slot === "tsq")
          ? {
              "@tanstack/solid-query":
                self.devDependencies["@tanstack/solid-query"],
            }
          : {}),
      };
    },
    jsx: "preserve",
    jsxImportSource: "solid-js",
  },
  factory,
});
