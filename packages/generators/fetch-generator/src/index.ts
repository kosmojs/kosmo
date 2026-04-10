import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator(() => {
  const meta: GeneratorMeta = {
    name: "Fetch",
    slot: "fetch",
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  };

  return {
    meta,
    factory: (sourceFolder) => factory(meta, sourceFolder),
  };
});
