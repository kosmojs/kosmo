import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator, vitePlugins } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
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
    plugins: () => [vitePlugins.nodePrefix()],
  };
});
