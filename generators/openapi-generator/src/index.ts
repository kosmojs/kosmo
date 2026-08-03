import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options, true>({
  meta: {
    name: "OpenAPI",
    resolveTypes: true,
  },
  factory,
});
