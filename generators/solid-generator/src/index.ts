import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "SolidJS",
    slot: "frontend",
    jsx: "preserve",
    jsxImportSource: "solid-js",
  },
  dependencies({ frontend }) {
    return {
      "solid-js": self.devDependencies["solid-js"],
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      ...(frontend?.tanstack?.query
        ? {
            "@tanstack/solid-query":
              self.devDependencies["@tanstack/solid-query"],
          }
        : {}),
    };
  },
  factory,
});
