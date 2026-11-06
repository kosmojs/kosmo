import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default defineGenerator({
  meta: {
    name: "Core",
  },
  factory,
});
