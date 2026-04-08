/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */

import type { GeneratorMeta } from "@kosmojs/core";
import self from "@kosmojs/fetch-generator/package.json" with { type: "json" };
import { defineGenerator } from "@kosmojs/lib";

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
