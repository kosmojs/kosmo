import type { TypeboxOptions } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator<TypeboxOptions>({
  meta: {
    name: "TypeBox",
    resolveTypes: true,
  },
  dependencies: {
    typebox: self.devDependencies.typebox,
  },
  factory,
});

export * from "./templates/lib/@typebox/error-handler";
