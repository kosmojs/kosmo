import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "TypeBox",
    resolveTypes: true,
    dependencies: {
      typebox: self.devDependencies.typebox,
    },
  },
  factory,
});

export * from "./templates/lib/@typebox/error-handler";
