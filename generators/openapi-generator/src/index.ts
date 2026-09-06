import type { OpenAPIOptions } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";

export default defineGenerator<OpenAPIOptions, true>({
  meta: {
    name: "OpenAPI",
    resolveTypes: true,
  },
  factory,
});
