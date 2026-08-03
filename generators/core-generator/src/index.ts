import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default defineGenerator({
  meta: {
    name: "Core",
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  },
  factory,
});
