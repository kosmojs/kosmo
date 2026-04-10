import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "TypeBox",
    resolveTypes: true,
    dependencies: {
      typebox: self.devDependencies.typebox,
    },
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});

export * from "./templates/lib/@typebox/error-handler";
