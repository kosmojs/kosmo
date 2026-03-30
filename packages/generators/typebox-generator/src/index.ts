import { defineGenerator, type GeneratorMeta } from "@kosmojs/lib";

// importing from local rather than published package
// cause no @kosmojs/* dependencies involved.
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
