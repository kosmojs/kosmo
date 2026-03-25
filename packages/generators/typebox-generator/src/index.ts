import { defineGenerator } from "@kosmojs/lib";

// importing from local rather than published package
// cause no @kosmojs/* dependencies involved.
import self from "../package.json" with { type: "json" };
import { factory } from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "TypeBox",
    resolveTypes: true,
    dependencies: {
      typebox: self.devDependencies.typebox,
    },
  },
);

export * from "./templates/error-handler";
