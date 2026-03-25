import { defineGenerator } from "@kosmojs/lib";

import { factory } from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options, true>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "OpenAPI",
    resolveTypes: true,
  },
);
