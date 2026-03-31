/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/hono-generator/package.json" with { type: "json" };
import { defineGenerator, type GeneratorMeta } from "@kosmojs/lib";

import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "Hono",
    slot: "api",
    dependencies: {
      hono: self.devDependencies.hono,
      "@hono/node-server": self.devDependencies["@hono/node-server"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  };
  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});
