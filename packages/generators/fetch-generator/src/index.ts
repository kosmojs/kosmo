/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/fetch-generator/package.json" with { type: "json" };
import { defineGenerator, type GeneratorMeta } from "@kosmojs/lib";

import factory from "./factory";

export default defineGenerator(() => {
  const meta: GeneratorMeta = {
    name: "Fetch",
    slot: "fetch",
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@kosmojs/fetch": self.version,
    },
  };

  return {
    meta,
    options: undefined,
    factory: (sourceFolder) => factory(meta, sourceFolder),
  };
});
